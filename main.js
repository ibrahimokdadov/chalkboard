const fs = require("fs/promises");
const path = require("path");
const { pathToFileURL } = require("url");
const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require("electron");
const { PDFParse } = require("pdf-parse");
const { analyzeFootage } = require("./footage-analysis");
const { ContextStore } = require("./context-store");

const textExtensions = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  ".tsv",
  ".json",
  ".jsonl",
  ".xml",
  ".html",
  ".htm",
  ".css",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".log",
  ".srt",
  ".vtt",
  ".pdf",
]);

const imageExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".tif",
  ".tiff",
]);

const videoExtensions = new Set([
  ".mp4",
  ".mov",
  ".m4v",
  ".webm",
  ".avi",
  ".mkv",
  ".mts",
  ".m2ts",
]);

const mimeTypes = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  ".csv": "text/csv",
  ".tsv": "text/tab-separated-values",
  ".json": "application/json",
  ".jsonl": "application/x-ndjson",
  ".xml": "application/xml",
  ".html": "text/html",
  ".htm": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".ts": "text/typescript",
  ".tsx": "text/typescript",
  ".jsx": "text/javascript",
  ".py": "text/x-python",
  ".log": "text/plain",
  ".srt": "text/plain",
  ".vtt": "text/vtt",
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".webm": "video/webm",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".mts": "video/mp2t",
  ".m2ts": "video/mp2t",
};

let mainWindow = null;
let pendingContextPaths = [];
let contextStore = null;

function store() {
  if (!contextStore) {
    contextStore = new ContextStore(path.join(app.getPath("userData"), "context-store.sqlite"));
  }
  return contextStore;
}

async function readTextSnippet(filePath, maxChars = 24000) {
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(Math.min(maxChars * 2, 120000));
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead).toString("utf8").replace(/\0/g, "").slice(0, maxChars);
  } finally {
    await handle.close();
  }
}

async function readPdfSnippet(filePath, maxChars = 24000) {
  const data = await fs.readFile(filePath);
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return String(result.text || "").replace(/\0/g, "").slice(0, maxChars);
  } finally {
    await parser.destroy();
  }
}

async function readDocumentText(filePath, extension) {
  if (extension === ".pdf") return readPdfSnippet(filePath);
  return readTextSnippet(filePath);
}

function baseKey(filePath) {
  return path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath))).toLowerCase();
}

function cleanTranscript(text) {
  return String(text || "")
    .replace(/^WEBVTT.*$/gim, "")
    .replace(/^\d+\s*$/gm, "")
    .replace(/\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{1,2}:\d{2}:\d{2}[,.]\d{3}.*$/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 24000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: "Chalkboard",
    backgroundColor: "#11120f",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  Menu.setApplicationMenu(null);
  mainWindow.webContents.once("did-finish-load", () => {
    if (pendingContextPaths.length) {
      mainWindow.webContents.send("context:open", pendingContextPaths);
      pendingContextPaths = [];
    }
  });
}

function getKind(extension, options) {
  if (textExtensions.has(extension)) return "text";
  if (options.includeImages && imageExtensions.has(extension)) return "image";
  if (options.includeVideos && videoExtensions.has(extension)) return "video";
  return "";
}

function getKindForExplicitFile(extension) {
  if (textExtensions.has(extension)) return "text";
  if (imageExtensions.has(extension)) return "image";
  if (videoExtensions.has(extension)) return "video";
  return "";
}

async function fileEntry(filePath, explicit = false) {
  const extension = path.extname(filePath).toLowerCase();
  const kind = explicit ? getKindForExplicitFile(extension) : "";
  if (!kind) return null;
  const stats = await fs.stat(filePath);
  if (!stats.isFile()) return null;
  const file = {
    path: filePath,
    name: path.basename(filePath),
    kind,
    type: mimeTypes[extension] || "application/octet-stream",
    size: stats.size,
    lastModified: stats.mtimeMs,
    extension,
    url: pathToFileURL(filePath).href,
  };
  if (kind === "text") file.text = await readDocumentText(filePath, extension);
  return file;
}

async function walkFolder(folderPath, options, files = []) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      await walkFolder(fullPath, options, files);
      continue;
    }
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    const kind = getKind(extension, options);
    if (!kind) continue;
    const stats = await fs.stat(fullPath);
    const file = {
      path: fullPath,
      name: entry.name,
      kind,
      type: mimeTypes[extension] || "application/octet-stream",
      size: stats.size,
      lastModified: stats.mtimeMs,
      extension,
      url: pathToFileURL(fullPath).href,
    };
    if (kind === "text") file.text = await readDocumentText(fullPath, extension);
    files.push(file);
  }
  return files;
}

async function entriesFromContextPaths(paths) {
  const files = [];
  for (const rawPath of paths || []) {
    const targetPath = path.resolve(rawPath);
    const stats = await fs.stat(targetPath).catch(() => null);
    if (!stats) continue;
    if (stats.isDirectory()) {
      await walkFolder(targetPath, { includeImages: true, includeVideos: true }, files);
      continue;
    }
    const entry = await fileEntry(targetPath, true);
    if (entry) files.push(entry);
  }
  await attachSidecarTranscripts(files);
  return files;
}

async function entriesFromDroppedPaths(paths, options = {}) {
  const files = [];
  for (const rawPath of paths || []) {
    const targetPath = path.resolve(rawPath);
    const stats = await fs.stat(targetPath).catch(() => null);
    if (!stats) continue;
    if (stats.isDirectory()) {
      await walkFolder(
        targetPath,
        {
          includeImages: Boolean(options.includeImages),
          includeVideos: Boolean(options.includeVideos),
        },
        files,
      );
      continue;
    }
    const entry = await fileEntry(targetPath, true);
    if (entry) files.push(entry);
  }
  await attachSidecarTranscripts(files);
  return files;
}

function contextPathsFromArgv(argv) {
  const markerIndex = argv.indexOf("--context");
  if (markerIndex >= 0) return argv.slice(markerIndex + 1).filter(Boolean);
  return [];
}

function openContextPaths(paths) {
  if (!paths?.length) return;
  if (mainWindow?.webContents) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("context:open", paths);
    return;
  }
  pendingContextPaths.push(...paths);
}

async function attachSidecarTranscripts(files) {
  const transcriptFiles = new Map();
  for (const file of files) {
    if (file.kind !== "text") continue;
    if (![".srt", ".vtt", ".txt"].includes(file.extension)) continue;
    transcriptFiles.set(baseKey(file.path), file);
  }

  for (const file of files) {
    if (file.kind !== "video") continue;
    const transcript = transcriptFiles.get(baseKey(file.path));
    if (!transcript?.text) continue;
    file.transcript = cleanTranscript(transcript.text);
    file.transcriptPath = transcript.path;
  }
}

ipcMain.handle("folder:select", async (_event, options = {}) => {
  const result = await dialog.showOpenDialog({
    title: "Choose a folder to index",
    properties: ["openDirectory"],
  });
  if (result.canceled || !result.filePaths.length) return { canceled: true, files: [] };

  const folderPath = result.filePaths[0];
  const files = await walkFolder(folderPath, {
    includeImages: Boolean(options.includeImages),
    includeVideos: Boolean(options.includeVideos),
  });
  await attachSidecarTranscripts(files);
  return {
    canceled: false,
    folderPath,
    files,
  };
});

ipcMain.handle("context:entries", async (_event, paths) => {
  const files = await entriesFromContextPaths(paths);
  return { files, readStates: await store().readStates(files) };
});

ipcMain.handle("drop:entries", async (_event, paths, options = {}) => {
  const files = await entriesFromDroppedPaths(paths, options);
  return { files, readStates: await store().readStates(files) };
});

ipcMain.handle("context:read-states", async (_event, files) => {
  return store().readStates(files);
});

ipcMain.handle("context:mark-read", async (_event, files, source) => {
  await store().upsert(files, source);
  return store().readStates(files);
});

ipcMain.handle("context:save", async (_event, files, source, model) => {
  await store().upsert(files, source, model);
  return store().readStates(files);
});

ipcMain.handle("context:search", async (_event, query, limit) => {
  return store().search(query, limit);
});

ipcMain.handle("context:semantic-status", async () => {
  return store().semanticStatus();
});

ipcMain.handle("footage:analyze", async (_event, payload) => {
  return analyzeFootage(payload);
});

ipcMain.handle("file:show", async (_event, filePath) => {
  if (!filePath) return;
  await shell.showItemInFolder(filePath);
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    openContextPaths(contextPathsFromArgv(argv));
  });

  pendingContextPaths = contextPathsFromArgv(process.argv);

  app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
