const http = require("http");
const fs = require("fs");
const path = require("path");
const { analyzeFootage } = require("./footage-analysis");

const root = __dirname;
const port = Number(process.env.PORT || 5177);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 30_000_000) {
        reject(new Error("Request body is too large. Try fewer clips or fewer frames per clip."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function handleAnalyzeFootage(req, res) {
  try {
    const data = JSON.parse(await readRequestBody(req));
    sendJson(res, 200, await analyzeFootage(data));
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Footage analysis failed." });
  }
}

function serveStatic(req, res) {
  const requestPath = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.normalize(path.join(root, safePath));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    if (req.method !== "HEAD") res.end(content);
    else res.end();
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/analyze-footage") {
    handleAnalyzeFootage(req, res);
    return;
  }
  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res);
    return;
  }
  res.writeHead(405);
  res.end("Method not allowed");
});

server.listen(port, () => {
  console.log(`Chalkboard dev server running at http://127.0.0.1:${port}`);
});
