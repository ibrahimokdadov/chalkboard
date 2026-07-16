const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");
const { SemanticIndex } = require("./semantic-index");

function normalizePath(filePath) {
  return path.resolve(filePath).toLowerCase();
}

async function fileFingerprint(filePath, stats) {
  const hash = crypto.createHash("sha256");
  hash.update(path.basename(filePath).toLowerCase());
  hash.update(String(stats.size));
  const handle = await fsp.open(filePath, "r");
  try {
    const chunkSize = 128 * 1024;
    const positions = [0];
    if (stats.size > chunkSize * 2) positions.push(Math.max(0, Math.floor(stats.size / 2) - Math.floor(chunkSize / 2)));
    if (stats.size > chunkSize) positions.push(Math.max(0, stats.size - chunkSize));
    for (const position of [...new Set(positions)]) {
      const buffer = Buffer.alloc(Math.min(chunkSize, Math.max(0, stats.size - position)));
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, position);
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    await handle.close();
  }
  return hash.digest("hex");
}

async function identityForPath(filePath) {
  const stats = await fsp.stat(filePath);
  if (!stats.isFile()) return null;
  return {
    path: filePath,
    normalizedPath: normalizePath(filePath),
    fingerprint: await fileFingerprint(filePath, stats),
    size: stats.size,
    modifiedMs: stats.mtimeMs,
  };
}

function asJson(value) {
  return JSON.stringify(value || []);
}

function fromJson(value, fallback = []) {
  try {
    return JSON.parse(value) || fallback;
  } catch {
    return fallback;
  }
}

function safeText(value, max = 24000) {
  return String(value || "").replace(/\0/g, "").slice(0, max);
}

class ContextStore {
  constructor(dbPath) {
    this.dbPath = dbPath;
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.semantic = new SemanticIndex(path.dirname(dbPath));
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA synchronous = NORMAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.migrate();
  }

  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY,
        path TEXT NOT NULL,
        normalized_path TEXT NOT NULL UNIQUE,
        fingerprint TEXT NOT NULL,
        size INTEGER NOT NULL,
        modified_ms REAL NOT NULL,
        name TEXT NOT NULL,
        kind TEXT,
        type TEXT,
        extension TEXT,
        source TEXT,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        read_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_files_fingerprint ON files(fingerprint);
      CREATE INDEX IF NOT EXISTS idx_files_kind ON files(kind);

      CREATE TABLE IF NOT EXISTS contexts (
        file_id INTEGER PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,
        summary TEXT,
        local_summary TEXT,
        quality TEXT,
        use_case TEXT,
        rating REAL,
        tags_json TEXT,
        search_phrases_json TEXT,
        moments_json TEXT,
        transcript_preview TEXT,
        text_preview TEXT,
        frame_times_json TEXT,
        model TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS context_fts USING fts5(
        file_id UNINDEXED,
        name,
        path,
        kind,
        summary,
        tags,
        phrases,
        transcript,
        text_preview,
        tokenize = 'unicode61'
      );
    `);
  }

  upsertPrepared() {
    return {
      file: this.db.prepare(`
        INSERT INTO files (
          path, normalized_path, fingerprint, size, modified_ms, name, kind, type, extension,
          source, first_seen_at, last_seen_at, read_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(normalized_path) DO UPDATE SET
          path = excluded.path,
          fingerprint = excluded.fingerprint,
          size = excluded.size,
          modified_ms = excluded.modified_ms,
          name = excluded.name,
          kind = excluded.kind,
          type = excluded.type,
          extension = excluded.extension,
          source = excluded.source,
          last_seen_at = excluded.last_seen_at,
          read_at = excluded.read_at
      `),
      getFile: this.db.prepare("SELECT id FROM files WHERE normalized_path = ?"),
      context: this.db.prepare(`
        INSERT INTO contexts (
          file_id, summary, local_summary, quality, use_case, rating, tags_json,
          search_phrases_json, moments_json, transcript_preview, text_preview,
          frame_times_json, model, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(file_id) DO UPDATE SET
          summary = excluded.summary,
          local_summary = excluded.local_summary,
          quality = excluded.quality,
          use_case = excluded.use_case,
          rating = excluded.rating,
          tags_json = excluded.tags_json,
          search_phrases_json = excluded.search_phrases_json,
          moments_json = excluded.moments_json,
          transcript_preview = excluded.transcript_preview,
          text_preview = excluded.text_preview,
          frame_times_json = excluded.frame_times_json,
          model = excluded.model,
          updated_at = excluded.updated_at
      `),
      deleteFts: this.db.prepare("DELETE FROM context_fts WHERE file_id = ?"),
      insertFts: this.db.prepare(`
        INSERT INTO context_fts (file_id, name, path, kind, summary, tags, phrases, transcript, text_preview)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
    };
  }

  async upsert(files, source = "local", model = "") {
    const now = new Date().toISOString();
    const statements = this.upsertPrepared();
    const tx = this.db.prepare("BEGIN IMMEDIATE");
    const commit = this.db.prepare("COMMIT");
    const rollback = this.db.prepare("ROLLBACK");
    tx.run();
    try {
      for (const file of files || []) {
        if (!file.path) continue;
        const identity = await identityForPath(file.path).catch(() => null);
        if (!identity) continue;
        const name = file.name || path.basename(file.path);
        const extension = file.extension || path.extname(file.path).toLowerCase();
        statements.file.run(
          file.path,
          identity.normalizedPath,
          identity.fingerprint,
          identity.size,
          identity.modifiedMs,
          name,
          file.kind || "",
          file.type || "",
          extension,
          source,
          now,
          now,
          now,
        );
        const row = statements.getFile.get(identity.normalizedPath);
        if (!row?.id) continue;

        const ai = file.ai || {};
        const tags = ai.tags || file.tags || [];
        const phrases = ai.searchPhrases || file.searchPhrases || [];
        const moments = ai.moments || file.moments || [];
        const summary = ai.summary || file.summary || "";
        const localSummary = file.localSummary || "";
        const transcript = safeText(file.transcript, 24000);
        const textPreview = safeText(file.text, 24000);
        const frameTimes = (file.frames || []).map((frame) => frame.time).filter((time) => Number.isFinite(time));

        statements.context.run(
          row.id,
          summary,
          localSummary,
          ai.quality || file.quality || "",
          ai.useCase || file.useCase || "",
          Number(ai.rating || file.rating || 0),
          asJson(tags),
          asJson(phrases),
          asJson(moments),
          transcript,
          textPreview,
          asJson(frameTimes),
          model || "",
          now,
        );

        statements.deleteFts.run(row.id);
        statements.insertFts.run(
          row.id,
          name,
          file.path,
          file.kind || "",
          [summary, localSummary, ai.quality, ai.useCase].filter(Boolean).join(" "),
          tags.join(" "),
          phrases.join(" "),
          transcript,
          textPreview,
        );
      }
      commit.run();
    } catch (error) {
      rollback.run();
      throw error;
    }

    try {
      this.semantic.upsert(files);
    } catch (error) {
      this.semantic.available = false;
      this.semantic.error = error.message;
    }
  }

  async readStates(files) {
    const byPath = this.db.prepare("SELECT id FROM files WHERE normalized_path = ?");
    const byFingerprint = this.db.prepare("SELECT id FROM files WHERE fingerprint = ?");
    const states = {};
    for (const file of files || []) {
      if (!file.path) continue;
      const identity = await identityForPath(file.path).catch(() => null);
      if (!identity) continue;
      states[file.path] = Boolean(byPath.get(identity.normalizedPath) || byFingerprint.get(identity.fingerprint));
    }
    return states;
  }

  search(query, limit = 80) {
    const likeQuery = `%${String(query || "").trim()}%`;
    const ftsQuery = String(query || "").trim().replace(/["']/g, " ");
    const rows = ftsQuery
      ? this.db
          .prepare(
            `
            SELECT f.path, f.name, f.kind, f.size, f.modified_ms, f.read_at,
                   c.summary, c.local_summary, c.quality, c.use_case, c.rating,
                   c.tags_json, c.search_phrases_json, c.moments_json, c.transcript_preview,
                   bm25(context_fts) AS rank
            FROM context_fts
            JOIN files f ON f.id = context_fts.file_id
            LEFT JOIN contexts c ON c.file_id = f.id
            WHERE context_fts MATCH ?
            ORDER BY rank
            LIMIT ?
          `,
          )
          .all(ftsQuery, limit)
      : this.db
          .prepare(
            `
            SELECT f.path, f.name, f.kind, f.size, f.modified_ms, f.read_at,
                   c.summary, c.local_summary, c.quality, c.use_case, c.rating,
                   c.tags_json, c.search_phrases_json, c.moments_json, c.transcript_preview
            FROM files f
            LEFT JOIN contexts c ON c.file_id = f.id
            WHERE f.name LIKE ? OR f.path LIKE ?
            ORDER BY f.read_at DESC
            LIMIT ?
          `,
          )
          .all(likeQuery, likeQuery, limit);

    const mapped = rows.map((row) => ({
      path: row.path,
      name: row.name,
      kind: row.kind,
      size: row.size,
      modifiedMs: row.modified_ms,
      readAt: row.read_at,
      summary: row.summary || row.local_summary || "",
      quality: row.quality || "",
      useCase: row.use_case || "",
      rating: row.rating || 0,
      tags: fromJson(row.tags_json),
      searchPhrases: fromJson(row.search_phrases_json),
      moments: fromJson(row.moments_json),
      transcript: row.transcript_preview || "",
      readBefore: true,
    }));
    const seen = new Set(mapped.map((row) => row.path));
    for (const semantic of this.semantic.search(query, limit)) {
      if (seen.has(semantic.path)) continue;
      mapped.push({
        path: semantic.path,
        name: semantic.name,
        kind: semantic.kind,
        size: 0,
        modifiedMs: 0,
        readAt: "",
        summary: semantic.semanticSnippet,
        quality: "",
        useCase: "semantic match",
        rating: 0,
        tags: ["semantic"],
        searchPhrases: [],
        moments: [],
        transcript: "",
        readBefore: true,
        semanticScore: semantic.semanticScore,
      });
      seen.add(semantic.path);
      if (mapped.length >= limit) break;
    }
    return mapped;
  }

  semanticStatus() {
    return {
      available: this.semantic.available,
      error: this.semantic.error,
    };
  }
}

module.exports = {
  ContextStore,
  identityForPath,
};
