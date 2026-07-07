const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = __dirname;
const port = Number(process.env.PORT || 5177);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const viewports = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
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
      if (body.length > 5_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function validateUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid http or https URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  return url.href;
}

async function capturePage(urlValue, viewportName = "desktop") {
  const url = validateUrl(urlValue);
  const viewport = viewports[viewportName] || viewports.desktop;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  }

  await page.waitForTimeout(500);
  const screenshot = await page.screenshot({ fullPage: false, type: "png" });
  const pageData = await page.evaluate(() => {
    const text = document.body?.innerText || "";
    const meta = document.querySelector("meta[name='description']")?.getAttribute("content") || "";
    const headings = [...document.querySelectorAll("h1,h2,h3")]
      .map((el) => el.textContent.trim())
      .filter(Boolean)
      .slice(0, 20);
    const buttons = [...document.querySelectorAll("button,a,input[type='submit']")]
      .map((el) => el.innerText || el.value || el.getAttribute("aria-label") || "")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 30);
    return {
      title: document.title,
      meta,
      headings,
      buttons,
      text: text.replace(/\s+/g, " ").trim().slice(0, 5000),
    };
  });

  await browser.close();

  return {
    url,
    viewport,
    viewportName,
    screenshot: screenshot.toString("base64"),
    ...pageData,
  };
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const chunks = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") chunks.push(content.text);
    }
  }
  return chunks.join("\n");
}

function parseJsonText(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("The model did not return JSON.");
    return JSON.parse(match[0]);
  }
}

function cleanHtml(text) {
  return String(text || "")
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function reviewPrompt(capture, goal) {
  return `
You are a senior product designer and conversion-focused UI reviewer.

Review the screenshot and return exact highlight boxes in screenshot pixel coordinates.
Screenshot size is ${capture.viewport.width} x ${capture.viewport.height}.

User goal:
${goal}

Page context:
${JSON.stringify(
  {
    url: capture.url,
    title: capture.title,
    meta: capture.meta,
    headings: capture.headings,
    buttons: capture.buttons,
    text: capture.text,
  },
  null,
  2,
)}

Return only JSON with this shape:
{
  "issues": [
    {
      "id": "short-id",
      "title": "short issue title",
      "severity": "Low | Medium | High",
      "category": "Hierarchy | CTA | Layout | Copy | Accessibility | Trust | Mobile | Visual polish",
      "x": 0,
      "y": 0,
      "width": 100,
      "height": 80,
      "why": "why this hurts usability, trust, or conversion",
      "fix": "specific design change"
    }
  ]
}

Rules:
- Return 4 to 8 issues.
- Coordinates must be within the screenshot bounds.
- Focus on visible UI, not generic marketing advice.
- If the page is blank or blocked, return one high-severity issue explaining that.
`;
}

function revampPrompt(capture, prompt) {
  return `
You are a senior product designer and frontend engineer.

Create a redesigned single-page HTML prototype based on the screenshot and page context.
The result must be self-contained HTML with CSS in a <style> tag. No external scripts. No external images unless using the original URL as plain text.

User direction:
${prompt}

Original page context:
${JSON.stringify(
  {
    url: capture.url,
    title: capture.title,
    meta: capture.meta,
    headings: capture.headings,
    buttons: capture.buttons,
    text: capture.text,
    viewport: capture.viewport,
  },
  null,
  2,
)}

Design requirements:
- Keep the same core offer and page intent.
- Improve hierarchy, spacing, contrast, CTA priority, proof, and trust.
- Make it responsive.
- Use polished, production-quality HTML/CSS.
- Do not include markdown fences.
- Return only the HTML document.
`;
}

async function callOpenAI({ apiKey, model, prompt, capture, wantsJson }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || "gpt-5.5",
      store: false,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${capture.screenshot}`,
              detail: "original",
            },
          ],
        },
      ],
      text: wantsJson
        ? {
            format: {
              type: "json_schema",
              name: "ui_review",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  issues: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        severity: { type: "string" },
                        category: { type: "string" },
                        x: { type: "number" },
                        y: { type: "number" },
                        width: { type: "number" },
                        height: { type: "number" },
                        why: { type: "string" },
                        fix: { type: "string" },
                      },
                      required: ["id", "title", "severity", "category", "x", "y", "width", "height", "why", "fix"],
                    },
                  },
                },
                required: ["issues"],
              },
            },
          }
        : undefined,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "OpenAI request failed.");
  }

  return payload;
}

async function getCaptureFromRequest(data) {
  if (data.capture?.screenshot && data.capture?.viewport) return data.capture;
  return capturePage(data.url, data.viewport);
}

async function handleCapture(req, res) {
  try {
    const data = JSON.parse(await readRequestBody(req));
    sendJson(res, 200, await capturePage(data.url, data.viewport));
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Capture failed." });
  }
}

async function handleReview(req, res) {
  try {
    const data = JSON.parse(await readRequestBody(req));
    if (!data.apiKey) {
      sendJson(res, 400, { error: "Missing OpenAI API key." });
      return;
    }

    const capture = await getCaptureFromRequest(data);
    const payload = await callOpenAI({
      apiKey: data.apiKey,
      model: data.model,
      prompt: reviewPrompt(capture, data.goal || ""),
      capture,
      wantsJson: true,
    });
    const parsed = parseJsonText(extractOutputText(payload));
    sendJson(res, 200, {
      capture,
      issues: parsed.issues || [],
      usage: payload.usage || null,
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Review failed." });
  }
}

async function handleRevamp(req, res) {
  try {
    const data = JSON.parse(await readRequestBody(req));
    if (!data.apiKey) {
      sendJson(res, 400, { error: "Missing OpenAI API key." });
      return;
    }

    const capture = await getCaptureFromRequest(data);
    const payload = await callOpenAI({
      apiKey: data.apiKey,
      model: data.model,
      prompt: revampPrompt(capture, data.prompt || ""),
      capture,
      wantsJson: false,
    });
    sendJson(res, 200, {
      capture,
      html: cleanHtml(extractOutputText(payload)),
      usage: payload.usage || null,
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Revamp failed." });
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
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/capture") {
    handleCapture(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/review-ui") {
    handleReview(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/revamp-ui") {
    handleRevamp(req, res);
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
  console.log(`ScreenLab running at http://127.0.0.1:${port}`);
});
