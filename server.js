const express = require("express");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = process.env.PORT || 3000;
const dbPath = process.env.DB_PATH || path.join(__dirname, "data", "suggestions.db");
const dbDir = path.dirname(dbPath);

fs.mkdirSync(dbDir, { recursive: true });

const db = new sqlite3.Database(dbPath, (error) => {
  if (error) {
    console.error("Failed to open database:", error.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT,
      contact TEXT,
      suggestion TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

app.use(express.json());
app.use(express.static(__dirname));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

app.get("/api/health", (_req, res) => {
  return res.json({ ok: true });
});

app.post("/api/suggestions", (req, res) => {
  const nickname = typeof req.body.nickname === "string" ? req.body.nickname.trim() : "";
  const contact = typeof req.body.contact === "string" ? req.body.contact.trim() : "";
  const suggestion = typeof req.body.suggestion === "string" ? req.body.suggestion.trim() : "";

  if (!suggestion) {
    return res.status(400).json({ message: "suggestion is required" });
  }

  const sql = "INSERT INTO suggestions (nickname, contact, suggestion) VALUES (?, ?, ?)";
  db.run(sql, [nickname, contact, suggestion], function onInsert(error) {
    if (error) {
      console.error("Insert failed:", error.message);
      return res.status(500).json({ message: "insert failed" });
    }

    return res.status(201).json({ id: this.lastID });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Database path: ${dbPath}`);
});
