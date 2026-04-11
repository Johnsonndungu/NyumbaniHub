import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import db from "./src/lib/db.js";
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
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- Auth Routes ---

  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, displayName, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4();
      
      const stmt = db.prepare(
        "INSERT INTO users (id, email, password, displayName, role) VALUES (?, ?, ?, ?, ?)"
      );
      stmt.run(id, email, hashedPassword, displayName, role || 'tenant');
      
      const user: any = db.prepare("SELECT id, email, displayName, role FROM users WHERE id = ?").get(id);
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({ user, token });
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
      const user: any = db.prepare("SELECT id, email FROM users WHERE email = ?").get(email);
      if (!user) {
        // For security, don't reveal if user exists or not
        return res.json({ message: "If an account exists with this email, a reset link has been sent." });
      }

      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

      const stmt = db.prepare(
        "INSERT INTO password_resets (id, userId, token, expiresAt) VALUES (?, ?, ?, ?)"
      );
      stmt.run(uuidv4(), user.id, token, expiresAt);

      // In a real app, send email here. For now, log it.
      console.log(`[PASSWORD RESET] Link: http://localhost:3000/reset-password?token=${token}`);
      
      res.json({ message: "If an account exists with this email, a reset link has been sent." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    try {
      const reset: any = db.prepare(
        "SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expiresAt > CURRENT_TIMESTAMP"
      ).get(token);

      if (!reset) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, reset.userId);
      db.prepare("UPDATE password_resets SET used = 1 WHERE id = ?").run(reset.id);

      res.json({ success: true, message: "Password has been reset successfully." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- API Routes (SQLite) ---

  // Users
  app.get("/api/users/:id", async (req, res) => {
    try {
      const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
      if (!row) return res.status(404).json({ error: "User not found" });
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/users", async (req, res) => {
    const { id, email, displayName, role, photoURL } = req.body;
    try {
      const stmt = db.prepare(
        "INSERT INTO users (id, email, displayName, role, photoURL) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET displayName = excluded.displayName, photoURL = excluded.photoURL"
      );
      stmt.run(id, email, displayName, role || 'tenant', photoURL);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    const { role, verified, displayName, phoneNumber } = req.body;
    try {
      const updates: string[] = [];
      const values: any[] = [];
      if (role) { updates.push("role = ?"); values.push(role); }
      if (verified !== undefined) { updates.push("isVerified = ?"); values.push(verified ? 1 : 0); }
      if (displayName) { updates.push("displayName = ?"); values.push(displayName); }
      if (phoneNumber) { updates.push("phoneNumber = ?"); values.push(phoneNumber); }
      
      if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
      
      values.push(req.params.id);
      const stmt = db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`);
      stmt.run(...values);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM users ORDER BY createdAt DESC").all();
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Properties
  app.get("/api/properties", async (req, res) => {
    const { ownerId, type } = req.query;
    try {
      let sql = "SELECT * FROM properties";
      const values: any[] = [];
      const conditions: string[] = [];
      
      if (ownerId) { conditions.push("ownerId = ?"); values.push(ownerId); }
      if (type && type !== 'all') { conditions.push("type = ?"); values.push(type); }
      
      if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
      sql += " ORDER BY createdAt DESC";
      
      const rows: any = db.prepare(sql).all(...values);
      // Parse JSON strings
      const parsedRows = rows.map((row: any) => ({
        ...row,
        amenities: row.amenities ? JSON.parse(row.amenities) : [],
        images: row.images ? JSON.parse(row.images) : []
      }));
      res.json(parsedRows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/properties", async (req, res) => {
    const { id, title, description, location, price, type, bedrooms, bathrooms, ownerId, ownerType, status, amenities, images } = req.body;
    try {
      const stmt = db.prepare(
        "INSERT INTO properties (id, title, description, location, price, type, bedrooms, bathrooms, ownerId, ownerType, status, amenities, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );
      stmt.run(
        id, title, description, location, price, type, bedrooms, bathrooms, ownerId, ownerType, status || 'available', 
        JSON.stringify(amenities || []), JSON.stringify(images || [])
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch("/api/properties/:id", async (req, res) => {
    const { title, description, location, price, type, bedrooms, bathrooms, status, amenities, images } = req.body;
    try {
      const updates: string[] = [];
      const values: any[] = [];
      if (title) { updates.push("title = ?"); values.push(title); }
      if (description) { updates.push("description = ?"); values.push(description); }
      if (location) { updates.push("location = ?"); values.push(location); }
      if (price) { updates.push("price = ?"); values.push(price); }
      if (type) { updates.push("type = ?"); values.push(type); }
      if (bedrooms) { updates.push("bedrooms = ?"); values.push(bedrooms); }
      if (bathrooms) { updates.push("bathrooms = ?"); values.push(bathrooms); }
      if (status) { updates.push("status = ?"); values.push(status); }
      if (amenities) { updates.push("amenities = ?"); values.push(JSON.stringify(amenities)); }
      if (images) { updates.push("images = ?"); values.push(JSON.stringify(images)); }
      
      if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
      
      values.push(req.params.id);
      const stmt = db.prepare(`UPDATE properties SET ${updates.join(", ")} WHERE id = ?`);
      stmt.run(...values);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    try {
      db.prepare("DELETE FROM properties WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Applications
  app.get("/api/applications", async (req, res) => {
    const { tenantId, propertyId } = req.query;
    try {
      let sql = "SELECT a.*, p.title as propertyTitle FROM applications a JOIN properties p ON a.propertyId = p.id";
      const values: any[] = [];
      const conditions: string[] = [];
      
      if (tenantId) { conditions.push("a.tenantId = ?"); values.push(tenantId); }
      if (propertyId) { conditions.push("a.propertyId = ?"); values.push(propertyId); }
      
      if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
      sql += " ORDER BY a.createdAt DESC";
      
      const rows = db.prepare(sql).all(...values);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/applications", async (req, res) => {
    const { id, propertyId, tenantId, status, message } = req.body;
    try {
      const stmt = db.prepare(
        "INSERT INTO applications (id, propertyId, tenantId, status, message) VALUES (?, ?, ?, ?, ?)"
      );
      stmt.run(id, propertyId, tenantId, status || 'pending', message);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch("/api/applications/:id", async (req, res) => {
    const { status } = req.body;
    try {
      db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Messages
  app.get("/api/messages", async (req, res) => {
    const { userId } = req.query;
    try {
      const rows = db.prepare(
        "SELECT * FROM messages WHERE senderId = ? OR receiverId = ? ORDER BY createdAt ASC"
      ).all(userId, userId);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    const { id, senderId, receiverId, text } = req.body;
    try {
      const stmt = db.prepare(
        "INSERT INTO messages (id, senderId, receiverId, text) VALUES (?, ?, ?, ?)"
      );
      stmt.run(id, senderId, receiverId, text);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Broadcasts
  app.post("/api/broadcasts", async (req, res) => {
    const { id, subject, content, target, senderId } = req.body;
    try {
      const stmt = db.prepare(
        "INSERT INTO broadcasts (id, subject, content, target, senderId) VALUES (?, ?, ?, ?, ?)"
      );
      stmt.run(id, subject, content, target, senderId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/payments", async (req, res) => {
    const { userId, propertyId } = req.query;
    try {
      let sql = "SELECT p.*, pr.title as propertyTitle, u.displayName as tenantName FROM payments p JOIN properties pr ON p.propertyId = pr.id JOIN users u ON p.userId = u.id";
      const values: any[] = [];
      const conditions: string[] = [];
      
      if (userId) { conditions.push("pr.ownerId = ?"); values.push(userId); }
      if (propertyId) { conditions.push("p.propertyId = ?"); values.push(propertyId); }
      
      if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
      sql += " ORDER BY p.createdAt DESC";
      
      const rows = db.prepare(sql).all(...values);
      res.json(rows);
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
      db.prepare(
        "INSERT INTO payments (id, userId, propertyId, amount, purpose, status, transactionId) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(paymentId, userId, propertyId, amount, purpose, "pending", response.data.CheckoutRequestID);

      res.json({ success: true, checkoutRequestId: response.data.CheckoutRequestID, paymentId });
    } catch (err: any) {
      console.error("M-Pesa STK Push Error:", err.response?.data || err.message);
      res.status(500).json({ error: "M-Pesa initiation failed. Please check your network and try again." });
    }
  });

  app.get("/api/payments/status/:id", async (req, res) => {
    try {
      const payment: any = db.prepare("SELECT * FROM payments WHERE id = ?").get(req.params.id);
      if (!payment) return res.status(404).json({ error: "Payment not found" });
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
      db.prepare(
        "INSERT INTO payments (id, userId, propertyId, amount, purpose, status, transactionId) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(paymentId, userId, propertyId, amount, purpose, "pending", paymentIntent.id);

      res.json({ clientSecret: paymentIntent.client_secret, paymentId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Webhook or manual update for demo purposes
  app.patch("/api/payments/:id", async (req, res) => {
    const { status, transactionId } = req.body;
    try {
      db.prepare("UPDATE payments SET status = ?, transactionId = COALESCE(?, transactionId) WHERE id = ?")
        .run(status, transactionId, req.params.id);
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
