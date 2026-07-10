import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import os from "os";

import "./db.js";
import { UPLOADS_DIR } from "./lib/upload.js";
import { sellersRouter } from "./routes/sellers.js";
import { productsRouter } from "./routes/products.js";
import { chatsRouter } from "./routes/chats.js";

const PORT = process.env.PORT || 4000;

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
// Native mobile builds (RN/Flutter) aren't subject to CORS at all — this only
// matters for browser-based clients (the web app, Expo web, Flutter web).
// Reflecting any origin is fine for local dev; lock this down before any
// real deployment.
app.use(cors({ origin: true }));
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api/sellers", sellersRouter);
app.use("/api/products", productsRouter);
app.use("/api/chats", chatsRouter);

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message?.includes("image") || err.message?.includes("audio")) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Erreur du serveur" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Snapy API running → http://localhost:${PORT}`);
  console.log(`  Android emulator → http://10.0.2.2:${PORT}`);
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const addr of addrs || []) {
      if (addr.family === "IPv4" && !addr.internal) {
        console.log(`  LAN / physical device → http://${addr.address}:${PORT}`);
      }
    }
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("⚠️  ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.");
  }
});
