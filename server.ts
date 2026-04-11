import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import db from "./src/lib/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET || "nyumbani-hub-secret-key";

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

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
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
