const path = require("path");
const crypto = require("crypto");

const DIMENSION = 128;

function chunkText(value, maxChars = 1400) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return [];
  const chunks = [];
  for (let index = 0; index < text.length; index += maxChars) {
    chunks.push(text.slice(index, index + maxChars));
    if (chunks.length >= 24) break;
  }
  return chunks;
}

function hashToken(token) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function localEmbedding(text) {
  const vector = new Float32Array(DIMENSION);
  const tokens = String(text || "")
    .toLowerCase()
    .match(/[a-z0-9_'-]{2,}/g) || [];
  for (const token of tokens) {
    const hash = hashToken(token);
    const index = hash % DIMENSION;
    vector[index] += hash & 1 ? 1 : -1;
  }
  let norm = 0;
  for (const value of vector) norm += value * value;
  norm = Math.sqrt(norm) || 1;
  return Array.from(vector, (value) => value / norm);
}

function docText(file) {
  const ai = file.ai || {};
  return [
    file.name,
    file.path,
    file.kind,
    file.localSummary,
    ai.summary,
    ai.quality,
    ai.useCase,
    ...(ai.tags || []),
    ...(ai.searchPhrases || []),
    file.text,
    file.transcript,
  ]
    .filter(Boolean)
    .join("\n");
}

function safeId(value) {
  return crypto.createHash("sha1").update(String(value)).digest("hex");
}

class SemanticIndex {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.available = false;
    this.error = "";
    try {
      const zvec = require("@zvec/zvec");
      this.zvec = zvec;
      this.collection = this.openCollection();
      this.available = true;
    } catch (error) {
      this.error = error.message || String(error);
    }
  }

  openCollection() {
    const {
      ZVecCollectionSchema,
      ZVecCreateAndOpen,
      ZVecDataType,
      ZVecIndexType,
      ZVecMetricType,
    } = this.zvec;
    const schema = new ZVecCollectionSchema({
      name: "loomark_chunks",
      vectors: {
        name: "embedding",
        dataType: ZVecDataType.VECTOR_FP32,
        dimension: DIMENSION,
        indexParams: {
          indexType: ZVecIndexType.FLAT,
          metricType: ZVecMetricType.COSINE,
        },
      },
      fields: [
        { name: "filePath", dataType: ZVecDataType.STRING },
        { name: "fileName", dataType: ZVecDataType.STRING },
        { name: "kind", dataType: ZVecDataType.STRING },
        { name: "text", dataType: ZVecDataType.STRING },
      ],
    });
    return ZVecCreateAndOpen(path.join(this.rootPath, "zvec-semantic"), schema);
  }

  upsert(files) {
    if (!this.available || !files?.length) return;
    const docs = [];
    for (const file of files) {
      if (!file.path) continue;
      const chunks = chunkText(docText(file));
      chunks.forEach((chunk, index) => {
        docs.push({
          id: `chunk_${safeId(`${file.path}#${index}`)}`,
          fields: {
            filePath: file.path,
            fileName: file.name || path.basename(file.path),
            kind: file.kind || "",
            text: chunk,
          },
          vectors: {
            embedding: localEmbedding(chunk),
          },
        });
      });
    }
    if (docs.length) this.collection.upsertSync(docs);
  }

  search(query, limit = 40) {
    if (!this.available || !String(query || "").trim()) return [];
    const results = this.collection.querySync({
      fieldName: "embedding",
      vector: localEmbedding(query),
      topk: limit,
    });
    const byPath = new Map();
    for (const result of results || []) {
      const fields = result.fields || {};
      const filePath = fields.filePath;
      if (!filePath || byPath.has(filePath)) continue;
      byPath.set(filePath, {
        path: filePath,
        name: fields.fileName || path.basename(filePath),
        kind: fields.kind || "",
        semanticScore: result.score || 0,
        semanticSnippet: fields.text || "",
      });
    }
    return [...byPath.values()];
  }
}

module.exports = {
  SemanticIndex,
  localEmbedding,
};
