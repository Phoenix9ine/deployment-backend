import fetch from "node-fetch";
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";
import cors from "cors";

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Ensure "uploads" folder exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 Created uploads folder");
} else {
  console.log("📁 Uploads folder already exists");
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Root route
app.get("/", (req, res) => {
  res.send("Backend is running successfully!");
});

// 🏓 Ping route
app.get("/ping", (req, res) => {
  res.json({
    message: "pong",
    server: "alive and well",
    timestamp: new Date().toISOString(),
  });
});

// 🩺 Health route (detailed)
app.get("/health", (req, res) => {
  const stats = {
    status: "✅ healthy",
    uptime: `${process.uptime().toFixed(2)}s`,
    memory: process.memoryUsage(),
    cpuLoad: os.loadavg(),
    freeMemory: `${(os.freemem() / 1024 / 1024).toFixed(2)} MB`,
    totalMemory: `${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`,
    platform: os.platform(),
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  };
  res.json(stats);
});

// 📂 File upload route
app.post("/upload", upload.array("files", 50), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    console.log("⚠️ Upload attempted but no files were sent");
    return res.status(400).json({ success: false, message: "No files uploaded" });
  }

  console.log(`📥 Received ${req.files.length} file(s):`);
  req.files.forEach(f => {
    console.log(` - ${f.filename} (${(f.size / 1024).toFixed(2)} KB, ${f.mimetype})`);
  });

  // --- Tree logging for uploaded files ---
  const buildTree = (files) => {
    const tree = {};
    files.forEach(f => {
      const parts = f.originalname.split('/');
      let current = tree;
      parts.forEach((part, i) => {
        if (!current[part]) {
          current[part] = (i === parts.length - 1) ? f.size : {};
        }
        current = current[part];
      });
    });
    return tree;
  };

  const printTree = (node, prefix = '') => {
    for (const key in node) {
      const isFile = typeof node[key] === 'number';
      const sizeKB = isFile ? (node[key] / 1024).toFixed(2) + ' KB' : '';
      console.log(`${prefix}${isFile ? '─' : '📂 '}${key}${sizeKB ? ' (' + sizeKB + ')' : ''}`);
      if (!isFile) printTree(node[key], prefix + '   ');
    }
  };

  console.log('📂 Upload Tree:');
  printTree(buildTree(req.files));

  res.json({
    success: true,
    message: `${req.files.length} file(s) uploaded successfully`,
    files: req.files.map(f => ({
      name: f.filename,
      path: f.path,
      size: f.size,
      mimetype: f.mimetype,
    })),
  });

  // ✅ Trigger WhatsApp-bot after successful upload
  try {
    console.log("📡 Sending deploy notification to WhatsApp-bot...");
    const response = await fetch("https://whatsapp-bot-xqkk.onrender.com/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🚀 Deploy complete!\nFiles uploaded: ${req.files.length}`
      }),
    });

    if (response.ok) {
      console.log("✅ WhatsApp notification sent successfully!");
    } else {
      console.log(`⚠️ Failed to notify WhatsApp-bot: ${response.statusText}`);
    }
  } catch (error) {
    console.error("❌ Error notifying WhatsApp-bot:", error);
  }

}); // closes /upload route

app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});
