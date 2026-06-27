import express from "express";
import path from "path";
import cors from "cors";
import multer from "multer";
import { existsSync, mkdirSync } from "fs";
import { createServer as createViteServer } from "vite";
import { supabase } from "./src/lib/supabase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import Stripe from "stripe";
import axios from "axios";

const JWT_SECRET = process.env.JWT_SECRET || "nyumbani-hub-secret-key";

let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  // --- File Storage Setup ---
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/uploads/");
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage });
  
  // Ensure uploads directory exists
  if (!existsSync("public/uploads")) {
    mkdirSync("public/uploads", { recursive: true });
  }

  app.use(cors());
  app.use(express.json());

  // Simple in-memory rate limiter for login (per-IP)
  const loginRateMap: Map<string, { count: number; firstSeen: number }> = new Map();
  const LOGIN_RATE_WINDOW = 60 * 1000; // 1 minute
  const LOGIN_MAX_PER_WINDOW = 10; // max attempts per IP per window

  const resolveRegistrationPaid = (user: any, role?: string) => {
    if (user?.registrationpaid !== undefined) return user.registrationpaid;
    return !(role === 'agent' || role === 'landlord');
  };

  // --- Auth Routes ---

  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, displayName, role, phoneNumber, country } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4();
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const isAgentOrLandlord = (role === 'agent' || role === 'landlord');
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          uid: id,
          email,
          password: hashedPassword,
          displayname: displayName,
          role: role || 'tenant',
          verificationtoken: verificationCode,
          verificationexpiresat: new Date(Date.now() + 45000).toISOString(),
          emailverified: false,
          phonenumber: phoneNumber,
          country: country || 'Kenya',
          registrationpaid: isAgentOrLandlord ? false : true
        })
        .select("*")
        .single();

      if (insertError) {
        if (insertError.message?.includes("column \"country\" does not exist")) {
          console.error("CRITICAL: The 'country' column is missing from your 'users' table. Please run the updated schema.sql or manually add it: ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT 'Kenya';");
        }
        throw insertError;
      }
      
      const sessionUser = {
        id: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayname,
        role: newUser.role,
        emailVerified: newUser.emailverified,
        isVerified: newUser.isverified,
        phoneNumber: newUser.phonenumber,
        country: newUser.country,
        registrationPaid: newUser.registrationpaid,
        viewQuota: newUser.viewquota || 10
      };
      
      const token = jwt.sign({ id: newUser.uid, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

      // In a real app, send verification email here
      console.log(`
=========================================
[EMAIL VERIFICATION CODE]
User: ${email}
Code: ${verificationCode}
=========================================
`);
      
      res.json({ user: sessionUser, token });
    } catch (err: any) {
      if (err.code === '23505') { // Postgres unique constraint violation
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    // Rate limit by IP
    try {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      const entry = loginRateMap.get(ip) || { count: 0, firstSeen: now };
      if (now - entry.firstSeen > LOGIN_RATE_WINDOW) {
        entry.count = 1;
        entry.firstSeen = now;
      } else {
        entry.count += 1;
      }
      loginRateMap.set(ip, entry);
      if (entry.count > LOGIN_MAX_PER_WINDOW) {
        return res.status(429).json({ error: 'Too many requests from this IP. Please try again later.' });
      }
    } catch (e) {
      // ignore rate limiter failures
    }
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    try {
      const { data: user, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (fetchError || !user || !user.password) {
        // Log failed attempt (do not reveal user existence)
        try {
          await supabase.from("failed_login_attempts").insert({ id: uuidv4(), userid: 'unknown', email, ipaddress: clientIp });
        } catch (e) {}
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // If account locked, check expiration
      if (user.accountlocked) {
        const now = new Date();
        if (user.lockeduntil && new Date(user.lockeduntil) > now) {
          const mins = Math.ceil((new Date(user.lockeduntil).getTime() - now.getTime()) / 60000);
          return res.status(429).json({ error: `Account locked. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`, locked: true });
        }
        // unlock if lockeduntil passed
        try { await supabase.from("users").update({ accountlocked: false, lockeduntil: null, failedloginattempts: 0 }).eq("uid", user.uid); } catch (e) {}
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        // Record failed attempt
        try { await supabase.from("failed_login_attempts").insert({ id: uuidv4(), userid: user.uid, email, ipaddress: clientIp }); } catch (e) {}

        const attempts = (user.failedloginattempts || 0) + 1;
        // Lock account after 4 failed attempts
        if (attempts >= 4) {
          const until = new Date(Date.now() + 15 * 60000).toISOString();
          try { await supabase.from("users").update({ accountlocked: true, lockeduntil: until, failedloginattempts: attempts, lastfailedloginat: new Date().toISOString() }).eq("uid", user.uid); } catch (e) {}
          return res.status(429).json({ error: "Account locked. Too many failed attempts. Try again in 15 minutes.", locked: true });
        }

        try { await supabase.from("users").update({ failedloginattempts: attempts, lastfailedloginat: new Date().toISOString() }).eq("uid", user.uid); } catch (e) {}
        return res.status(401).json({ error: `Invalid credentials. ${4 - attempts} attempt${4 - attempts !== 1 ? 's' : ''} remaining.`, attemptsRemaining: 4 - attempts });
      }

      // Successful login - reset counters
      try { await supabase.from("users").update({ failedloginattempts: 0, lastfailedloginat: null }).eq("uid", user.uid); } catch (e) {}

      const token = jwt.sign({ id: user.uid, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      const { password: _, ...userWithoutPassword } = user;
      const sessionUser = {
        ...userWithoutPassword,
        id: user.uid,
        displayName: user.displayname,
        emailVerified: user.emailverified,
        isVerified: user.isverified,
        photoURL: user.photourl,
        phoneNumber: user.phonenumber,
        country: user.country,
        registrationPaid: user.registrationpaid,
        viewQuota: user.viewquota
      };
      res.json({ user: sessionUser, token });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("uid, email")
        .eq("email", email)
        .single();

      if (error || !user) {
        // For security, don't reveal if user exists or not
        return res.json({ message: "If an account exists with this email, a reset link has been sent." });
      }

      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

      const { error: resetError } = await supabase
        .from("password_resets")
        .insert({
          id: uuidv4(),
          userid: user.uid,
          token,
          expiresat: expiresAt
        });

      if (resetError) throw resetError;

      // In a real app, send email here. For now, log it.
      const resetLink = `/reset-password?token=${token}`;
      console.log(`
=========================================
[PASSWORD RESET REQUEST]
User: ${user.email}
Relative Link: ${resetLink}
Full Link: http://localhost:3000${resetLink}
=========================================
`);
      
      res.json({ message: "If an account exists with this email, a reset link has been sent." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    try {
      const { data: reset, error: fetchError } = await supabase
        .from("password_resets")
        .select("*")
        .eq("token", token)
        .eq("used", false)
        .gt("expiresat", new Date().toISOString())
        .single();

      if (fetchError || !reset) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ password: hashedPassword })
        .eq("uid", reset.userid);

      if (userUpdateError) throw userUpdateError;

      await supabase
        .from("password_resets")
        .update({ used: true })
        .eq("id", reset.id);

      res.json({ success: true, message: "Password has been reset successfully." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/auth/verify-email", async (req, res) => {
    const { token, code, email } = req.query;
    const verificationValue = token || code;
    
    try {
      let query = supabase.from("users").select("*");
      
      if (email) {
        query = query.eq("email", email);
      }
      
      const { data: user, error: fetchError } = await query
        .eq("verificationtoken", verificationValue)
        .single();

      if (fetchError || !user) {
        return res.status(400).json({ error: "Invalid or expired verification code" });
      }

      await supabase
        .from("users")
        .update({ emailverified: true, verificationtoken: null })
        .eq("uid", user.uid);

      res.json({ success: true, message: "Email verified successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/resend-verification", async (req, res) => {
    const { email } = req.body;
    try {
      const { data: user, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (fetchError || !user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.emailVerified) {
        return res.status(400).json({ error: "Email is already verified" });
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      await supabase
        .from("users")
        .update({ verificationtoken: verificationCode })
        .eq("uid", user.uid);

      // Log for dev
      console.log(`
=========================================
[EMAIL VERIFICATION CODE RESEND]
User: ${email}
Code: ${verificationCode}
=========================================
`);

      res.json({ success: true, message: "Verification code sent." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Auth Middleware ---
  const authenticate = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("uid", decoded.id)
        .single();

      if (error || !user) return res.status(401).json({ error: "User not found" });
      req.user = { 
        ...user, 
        id: user.uid, 
        displayName: user.displayname,
        isVerified: user.isverified,
        emailVerified: user.emailverified,
        phoneNumber: user.phonenumber,
        country: user.country,
        role: user.role
      };
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- API Routes (Supabase) ---

  // Users
  app.get("/api/users/:id", authenticate, async (req: any, res: any) => {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("uid", req.params.id)
        .single();

      if (error || !user) return res.status(404).json({ error: "User not found" });
      
      const formattedUser = {
        id: user.uid,
        email: user.email,
        displayName: user.displayname,
        role: user.role,
        isVerified: user.isverified,
        emailVerified: user.emailverified,
        photoURL: user.photourl,
        phoneNumber: user.phonenumber,
        country: user.country,
        documentURL: user.documenturl,
        documentType: user.documenttype,
        registrationPaid: user.registrationpaid,
        viewQuota: user.viewquota,
        createdAt: user.createdat
      };
      res.json(formattedUser);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Decrement a user's view quota when they view a property
  app.post('/api/users/:id/decrement-viewquota', authenticate, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      if (req.user.id !== id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

      const { data: u, error: fetchErr } = await supabase.from('users').select('viewquota').eq('uid', id).single();
      if (fetchErr || !u) return res.status(404).json({ error: 'User not found' });

      const current = (u && u.viewquota) ? u.viewquota : 0;
      if (current <= 0) return res.status(402).json({ error: 'View quota exhausted' });

      const { data: updated, error: updErr } = await supabase.from('users').update({ viewquota: current - 1 }).eq('uid', id).select('*').single();
      if (updErr) throw updErr;

      res.json({ success: true, viewQuota: updated.viewquota });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/users", authenticate, async (req: any, res: any) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: Admin only" });
    }
    const { id, email, displayName, role, photoURL } = req.body;
    try {
      const { error } = await supabase
        .from("users")
        .upsert({ 
          uid: id, 
          email, 
          displayname: displayName, 
          role: role || 'tenant', 
          photourl: photoURL 
        });

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch("/api/users/:id", authenticate, async (req: any, res: any) => {
    const { id } = req.params;
    const { role, verified, displayName, phoneNumber, country, photoURL, documentURL, documentType, registrationPaid } = req.body;
    const isTargetingSelf = req.user.id === id;
    const isAdmin = req.user.role === 'admin';

    try {
      if (!isAdmin && !isTargetingSelf) {
        return res.status(403).json({ error: "forbidden: You can only update your own profile" });
      }

      if ((role !== undefined || verified !== undefined) && !isAdmin) {
        return res.status(403).json({ error: "Forbidden: Only admins can change roles or verification status" });
      }

      const updates: any = {};
      
      if (isAdmin && role) updates.role = role;
      if (isAdmin && verified !== undefined) updates.isverified = verified;
      // Allow users to mark their registration payment as completed (only to true)
      if (registrationPaid !== undefined) {
        if (!isTargetingSelf) return res.status(403).json({ error: "Forbidden: cannot modify registration status for other users" });
        if (registrationPaid !== true) return res.status(400).json({ error: "Invalid registrationPaid value" });
        updates.registrationpaid = true;
      }
      
      if (displayName) updates.displayname = displayName;
      if (phoneNumber) updates.phonenumber = phoneNumber;
      if (country) updates.country = country;
      if (photoURL) updates.photourl = photoURL;
      if (documentURL) updates.documenturl = documentURL;
      if (documentType) updates.documenttype = documentType;
      
      if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
      
      const { data: updatedUser, error } = await supabase
        .from("users")
        .update(updates)
        .eq("uid", id)
        .select("*")
        .single();

      if (error) throw error;
      
      const formattedUser = {
        id: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayname,
        role: updatedUser.role,
        isVerified: updatedUser.isverified,
        emailVerified: updatedUser.emailverified,
        photoURL: updatedUser.photourl,
        phoneNumber: updatedUser.phonenumber,
        country: updatedUser.country,
        documentURL: updatedUser.documenturl,
        documentType: updatedUser.documenttype,
        registrationPaid: updatedUser.registrationpaid,
        createdAt: updatedUser.createdat
      };
      res.json(formattedUser);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/users", authenticate, async (req: any, res: any) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: Admin only" });
    }
    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .order("createdat", { ascending: false });

      if (error) throw error;
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Admin: unlock user account
  app.post("/api/admin/unlock-user", authenticate, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admin only' });
    const { id, email } = req.body;
    if (!id && !email) return res.status(400).json({ error: 'Provide id or email' });
    try {
      let query = supabase.from('users').select('*');
      query = id ? query.eq('uid', id) : query.eq('email', email);
      const { data: user, error: fetchError } = await query.single();
      if (fetchError || !user) return res.status(404).json({ error: 'User not found' });

      const { error: updateError } = await supabase
        .from('users')
        .update({ accountlocked: false, lockeduntil: null, failedloginattempts: 0, lastfailedloginat: null })
        .eq('uid', user.uid);
      if (updateError) throw updateError;
      res.json({ success: true, message: 'Account unlocked' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/users/:id", authenticate, async (req: any, res: any) => {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: "Forbidden: Only admins can delete other users" });
    }
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("uid", req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/upload", authenticate, upload.single("file"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Properties
  app.get("/api/properties", async (req, res) => {
    const { ownerId, type, country } = req.query;
    try {
      let query = supabase.from("properties").select("*");
      
      if (ownerId) query = query.eq("ownerid", ownerId);
      if (type && type !== 'all') query = query.eq("type", type);
      if (country && country !== 'all') query = query.eq("country", country);
      
      const { data: properties, error } = await query.order("createdat", { ascending: false });

      if (error) throw error;
      
      const formatted = properties.map((p: any) => ({
        ...p,
        ownerId: p.ownerid,
        ownerType: p.ownertype,
        createdAt: p.createdat
      }));
      res.json(formatted);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/properties", authenticate, async (req: any, res: any) => {
    if (req.user.role === 'tenant') {
      return res.status(403).json({ error: "Tenants cannot list properties" });
    }
    if (!req.user.isVerified) {
      return res.status(403).json({ error: "Your account must be verified by an admin before you can list properties." });
    }
    const { id, title, description, location, country, price, type, bedrooms, bathrooms, ownerId, ownerType, status, amenities, images } = req.body;
    try {
      const { error } = await supabase
        .from("properties")
        .insert({
          id, 
          title, 
          description, 
          location, 
          country: country || 'Kenya', 
          price, 
          type, 
          bedrooms, 
          bathrooms, 
          ownerid: ownerId, 
          ownertype: ownerType, 
          status: status || 'available', 
          amenities: amenities || [], 
          images: images || []
        });

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch("/api/properties/:id", authenticate, async (req: any, res: any) => {
    const { title, description, location, country, price, type, bedrooms, bathrooms, status, amenities, images } = req.body;
    try {
      const { data: property, error: fetchError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (fetchError || !property) return res.status(404).json({ error: "Property not found" });
      
      if (req.user.role !== 'admin' && req.user.id !== property.ownerid) {
        return res.status(403).json({ error: "Forbidden: You do not own this property" });
      }

      const updates: any = {};
      if (title) updates.title = title;
      if (description) updates.description = description;
      if (location) updates.location = location;
      if (country) updates.country = country;
      if (price) updates.price = price;
      if (type) updates.type = type;
      if (bedrooms) updates.bedrooms = bedrooms;
      if (bathrooms) updates.bathrooms = bathrooms;
      if (status) updates.status = status;
      if (amenities) updates.amenities = amenities;
      if (images) updates.images = images;
      
      if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
      
      const { error: updateError } = await supabase
        .from("properties")
        .update(updates)
        .eq("id", req.params.id);

      if (updateError) throw updateError;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/properties/:id", authenticate, async (req: any, res: any) => {
    try {
      const { data: property, error: fetchError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (fetchError || !property) return res.status(404).json({ error: "Property not found" });

      if (req.user.role !== 'admin' && req.user.id !== property.ownerid) {
        return res.status(403).json({ error: "Forbidden: You do not own this property" });
      }

      const { error: deleteError } = await supabase
        .from("properties")
        .delete()
        .eq("id", req.params.id);

      if (deleteError) throw deleteError;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Applications
  app.get("/api/applications", async (req, res) => {
    const { tenantId, propertyId } = req.query;
    try {
      let query = supabase.from("applications").select("*, properties(title)");
      
      if (tenantId) query = query.eq("tenantid", tenantId);
      if (propertyId) query = query.eq("propertyid", propertyId);
      
      const { data: applications, error } = await query.order("createdat", { ascending: false });

      if (error) throw error;
      
      // Flatten joined property title and format keys
      const formatted = applications.map((app: any) => ({
        ...app,
        propertyTitle: app.properties?.title,
        tenantId: app.tenantid,
        propertyId: app.propertyid,
        createdAt: app.createdat
      }));
      
      res.json(formatted);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/applications", async (req, res) => {
    const { id, propertyId, tenantId, status, message } = req.body;
    try {
      const { error } = await supabase
        .from("applications")
        .insert({
          id, 
          propertyid: propertyId, 
          tenantid: tenantId, 
          status: status || 'pending', 
          message
        });

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch("/api/applications/:id", async (req, res) => {
    const { status } = req.body;
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Messages
  app.get("/api/messages", async (req, res) => {
    const { userId } = req.query;
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`senderid.eq.${userId},receiverid.eq.${userId}`)
        .order("createdat", { ascending: true });

      if (error) throw error;
      
      const formatted = (data || []).map((m: any) => ({
        ...m,
        senderId: m.senderid,
        receiverId: m.receiverid,
        createdAt: m.createdat
      }));
      res.json(formatted);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    const { id, senderId, receiverId, text } = req.body;
    try {
      const { error } = await supabase
        .from("messages")
        .insert({ id, senderid: senderId, receiverid: receiverId, text });

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Broadcasts
  app.post("/api/broadcasts", authenticate, async (req: any, res: any) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: Admin only" });
    }
    const { id, subject, content, target, senderId } = req.body;
    try {
      const { error } = await supabase
        .from("broadcasts")
        .insert({ id, subject, content, target, senderid: senderId });

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/payments", async (req, res) => {
    const { userId, propertyId } = req.query;
    try {
      let query = supabase.from("payments").select("*, properties(title, ownerid), users(displayname)");
      
      if (propertyId) query = query.eq("propertyid", propertyId);
      
      const { data: payments, error } = await query.order("createdat", { ascending: false });

      if (error) throw error;
      
      // Filter by property owner if userId matches ownerid
      let filtered = payments;
      if (userId) {
        filtered = payments.filter((p: any) => p.properties?.ownerid === userId);
      }
      
      const formatted = filtered.map((p: any) => ({
        ...p,
        propertyTitle: p.properties?.title,
        tenantName: p.users?.displayname,
        userId: p.userid,
        propertyId: p.propertyid,
        transactionId: p.transactionid,
        createdAt: p.createdat
      }));
      
      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- Payment Routes ---

  // M-Pesa OAuth Token Helper
  const getMpesaToken = async () => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    if (!consumerKey || !consumerSecret) throw new Error("M-Pesa credentials missing");

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );
    return response.data.access_token;
  };

  app.post("/api/payments/mpesa/stkpush", async (req, res) => {
    const { phoneNumber, amount, propertyId, userId, purpose } = req.body;
    try {
      const token = await getMpesaToken();
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
      const shortcode = process.env.MPESA_SHORTCODE || "174379";
      const passkey = process.env.MPESA_PASSKEY;
      if (!passkey) throw new Error("M-Pesa passkey missing");

      const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
      const callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.APP_URL}/api/payments/mpesa/callback`;

      const response = await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: phoneNumber,
          PartyB: shortcode,
          PhoneNumber: phoneNumber,
          CallBackURL: callbackUrl,
          AccountReference: `NyumbaniHub-${propertyId.slice(0, 5)}`,
          TransactionDesc: `Payment for ${purpose}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Record pending payment
      const paymentId = uuidv4();
      const { error: insertError } = await supabase
        .from("payments")
        .insert({
          id: paymentId,
          userid: userId,
          propertyid: propertyId,
          amount,
          purpose,
          status: "pending",
          transactionid: response.data.CheckoutRequestID
        });

      if (insertError) throw insertError;

      res.json({ success: true, checkoutRequestId: response.data.CheckoutRequestID, paymentId });
    } catch (err: any) {
      console.error("M-Pesa STK Push Error:", err.response?.data || err.message);
      res.status(500).json({ error: "M-Pesa initiation failed. Please check your network and try again." });
    }
  });

  // M-Pesa callback endpoint to receive STK push results
  app.post('/api/payments/mpesa/callback', async (req, res) => {
    try {
      const body = req.body;
      // Safaricom wraps result in Body.stkCallback
      const stk = body?.Body?.stkCallback;
      if (!stk) return res.status(400).json({ error: 'Invalid callback payload' });

      const checkoutRequestId = stk.CheckoutRequestID;
      const resultCode = stk.ResultCode;

      // Find pending payment by CheckoutRequestID (stored as transactionid)
      const { data: payment, error: pErr } = await supabase
        .from('payments')
        .select('*')
        .eq('transactionid', checkoutRequestId)
        .single();

      if (pErr || !payment) {
        console.warn('Payment not found for CheckoutRequestID', checkoutRequestId);
        return res.json({ success: true });
      }

      if (resultCode === 0) {
        // Successful payment
        const mpesaReceipt = stk.CallbackMetadata?.Item?.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value || null;
        const amount = stk.CallbackMetadata?.Item?.find((i: any) => i.Name === 'Amount')?.Value || payment.amount;
        const phone = stk.CallbackMetadata?.Item?.find((i: any) => i.Name === 'PhoneNumber')?.Value || null;

        const { error: updErr } = await supabase
          .from('payments')
          .update({ status: 'completed', transactionid: mpesaReceipt || checkoutRequestId, amount })
          .eq('id', payment.id);

        if (updErr) throw updErr;

        // If this payment is for registration (we use propertyid 'registration' earlier), mark user registration paid
        if (payment.purpose === 'deposit' && payment.propertyid === 'registration') {
          await supabase
            .from('users')
            .update({ registrationpaid: true })
            .eq('uid', payment.userid);
        } else if (payment.purpose === 'viewpack' || payment.propertyid === 'viewpack') {
          // Credit user's view quota by 20 for a viewpack purchase
          const { data: u } = await supabase.from('users').select('viewquota').eq('uid', payment.userid).single();
          const current = (u && u.viewquota) ? u.viewquota : 0;
          await supabase
            .from('users')
            .update({ viewquota: current + 20 })
            .eq('uid', payment.userid);
        }
      } else {
        // Failed
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', payment.id);
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error('MPesa callback error:', err?.message || err);
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  app.get("/api/payments/status/:id", async (req, res) => {
    try {
      const { data: payment, error } = await supabase
        .from("payments")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (error || !payment) return res.status(404).json({ error: "Payment not found" });
      res.json(payment);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/payments/stripe/create-intent", async (req, res) => {
    const { amount, propertyId, userId, purpose } = req.body;
    const stripeClient = getStripe();
    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe is not configured on the server." });
    }

    try {
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects cents
        currency: "kes",
        metadata: { propertyId, userId, purpose },
      });

      // Record pending payment
      const paymentId = uuidv4();
      const { error: insertError } = await supabase
        .from("payments")
        .insert({
          id: paymentId,
          userid: userId,
          propertyid: propertyId,
          amount,
          purpose,
          status: "pending",
          transactionid: paymentIntent.id
        });

      if (insertError) throw insertError;

      res.json({ clientSecret: paymentIntent.client_secret, paymentId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Stripe webhook endpoint to handle payment events
  app.post('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const stripeClient = getStripe();
    if (!stripeClient) return res.status(500).send('Stripe not configured');
    const sig = req.headers['stripe-signature'] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: any;

    try {
      if (webhookSecret && sig) {
        event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // If no webhook secret configured, try parsing body (less secure)
        event = JSON.parse(req.body.toString());
      }
    } catch (err: any) {
      console.error('Stripe webhook signature verification failed.', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === 'payment_intent.succeeded') {
        const intent = event.data.object;
        const paymentIntentId = intent.id;

        const { data: payment, error } = await supabase
          .from('payments')
          .select('*')
          .eq('transactionid', paymentIntentId)
          .single();

        if (!error && payment) {
          await supabase
            .from('payments')
            .update({ status: 'completed' })
            .eq('id', payment.id);

          if (payment.purpose === 'deposit' && payment.propertyid === 'registration') {
            await supabase
              .from('users')
              .update({ registrationpaid: true })
              .eq('uid', payment.userid);
          }

          // If this payment was for view quota (viewpack), credit the user
          if (payment.purpose === 'viewpack' || payment.propertyid === 'viewpack') {
            const { data: u } = await supabase.from('users').select('viewquota').eq('uid', payment.userid).single();
            const current = (u && u.viewquota) ? u.viewquota : 0;
            await supabase
              .from('users')
              .update({ viewquota: current + 20 })
              .eq('uid', payment.userid);
          }
        }
      } else if (event.type === 'payment_intent.payment_failed') {
        const intent = event.data.object;
        const paymentIntentId = intent.id;
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('transactionid', paymentIntentId);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('Stripe webhook handling error:', err.message || err);
      res.status(500).json({ error: err.message || 'Webhook handling error' });
    }
  });

  // Webhook or manual update for demo purposes
  app.patch("/api/payments/:id", async (req, res) => {
    const { status, transactionId } = req.body;
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          status,
          transactionid: transactionId || undefined
        })
        .eq("id", req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
