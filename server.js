const express = require("express");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = process.env.PORT || 3000;
const dbPath = process.env.DB_PATH || path.join(__dirname, "data", "suggestions.db");
const dbDir = path.dirname(dbPath);
const FIELD_LIMITS = {
  nickname: 40,
  contact: 80,
  suggestion: 800,
  sourcePath: 200,
  userAgent: 300,
  clientIp: 80
};

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

  db.run(`
    CREATE TABLE IF NOT EXISTS suggestion_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      suggestion_id INTEGER NOT NULL,
      source_path TEXT,
      user_agent TEXT,
      client_ip TEXT,
      payload_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (suggestion_id) REFERENCES suggestions(id)
    )
  `);

  db.run("CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at)");
  db.run("CREATE INDEX IF NOT EXISTS idx_suggestion_events_suggestion_id ON suggestion_events(suggestion_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_suggestion_events_created_at ON suggestion_events(created_at)");
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

app.get("/api/suggestions/stats", (_req, res) => {
  db.get("SELECT COUNT(*) AS count FROM suggestions", [], (error, row) => {
    if (error) {
      console.error("Count query failed:", error.message);
      return res.status(500).json({ message: "count query failed" });
    }
    return res.json({ count: row?.count || 0 });
  });
});

app.get("/api/suggestions", (req, res) => {
  const parsedLimit = Number.parseInt(String(req.query.limit || "50"), 10);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50;

  const sql = `
    SELECT
      s.id,
      s.nickname,
      s.suggestion,
      s.created_at,
      e.source_path AS sourcePath
    FROM suggestions s
    LEFT JOIN suggestion_events e
      ON e.id = (
        SELECT se.id
        FROM suggestion_events se
        WHERE se.suggestion_id = s.id
        ORDER BY se.id DESC
        LIMIT 1
      )
    ORDER BY s.id DESC
    LIMIT ?
  `;

  db.all(sql, [limit], (error, rows) => {
    if (error) {
      console.error("List query failed:", error.message);
      return res.status(500).json({ message: "list query failed" });
    }
    return res.json({ items: rows || [] });
  });
});

app.post("/api/suggestions", (req, res) => {
  const nicknameRaw = typeof req.body.nickname === "string" ? req.body.nickname.trim() : "";
  const contactRaw = typeof req.body.contact === "string" ? req.body.contact.trim() : "";
  const suggestionRaw = typeof req.body.suggestion === "string" ? req.body.suggestion.trim() : "";
  const sourcePathRaw = typeof req.body.sourcePath === "string" ? req.body.sourcePath.trim() : "";

  const userAgentRaw = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"].trim() : "";
  const forwardedFor = typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"] : "";
  const clientIpRaw = (forwardedFor.split(",")[0] || req.socket.remoteAddress || "").trim();

  const nickname = nicknameRaw.slice(0, FIELD_LIMITS.nickname);
  const contact = contactRaw.slice(0, FIELD_LIMITS.contact);
  const suggestion = suggestionRaw.slice(0, FIELD_LIMITS.suggestion);
  const sourcePath = sourcePathRaw.slice(0, FIELD_LIMITS.sourcePath);
  const userAgent = userAgentRaw.slice(0, FIELD_LIMITS.userAgent);
  const clientIp = clientIpRaw.slice(0, FIELD_LIMITS.clientIp);

  if (!suggestion) {
    return res.status(400).json({ message: "suggestion is required" });
  }

  const insertSuggestionSql = "INSERT INTO suggestions (nickname, contact, suggestion) VALUES (?, ?, ?)";

  db.run(insertSuggestionSql, [nickname, contact, suggestion], function onInsert(error) {
    if (error) {
      console.error("Insert failed:", error.message);
      return res.status(500).json({ message: "insert failed" });
    }

    const suggestionId = this.lastID;
    const payloadJson = JSON.stringify({
      nickname,
      contact,
      suggestion,
      sourcePath
    });

    const insertEventSql = `
      INSERT INTO suggestion_events (suggestion_id, source_path, user_agent, client_ip, payload_json)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.run(insertEventSql, [suggestionId, sourcePath, userAgent, clientIp, payloadJson], (eventError) => {
      if (eventError) {
        console.error("Insert suggestion event failed:", eventError.message);
      }

      return res.status(201).json({ id: suggestionId });
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Database path: ${dbPath}`);
});
