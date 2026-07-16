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
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) throw new Error("The model did not return JSON.");
    return JSON.parse(match[0]);
  }
}

function buildPrompt({ clips, goal }) {
  const metadata = clips.map((clip) => ({
    id: clip.id,
    name: clip.name,
    path: clip.path,
    kind: clip.kind,
    type: clip.type,
    size: clip.size,
    duration: clip.duration,
    width: clip.width,
    height: clip.height,
    notes: clip.notes,
    localSummary: clip.localSummary,
    textPreview: clip.text ? String(clip.text).slice(0, 6000) : "",
    transcriptPreview: clip.transcript ? String(clip.transcript).slice(0, 6000) : "",
    transcriptPath: clip.transcriptPath,
    frames: (clip.frames || []).map((frame, index) => ({
      index: index + 1,
      time: frame.time,
      label: frame.label,
    })),
  }));

  return `
You are a folder context librarian building searchable context for local files.

Indexing goal:
${goal || "Create useful metadata for finding and understanding footage in an edit."}

File metadata:
${JSON.stringify(metadata, null, 2)}

Return only JSON with this shape:
{
  "clips": [
    {
      "id": "same clip id",
      "summary": "one sentence describing visible content and editorial value",
      "tags": ["short lowercase searchable tags"],
      "rating": 1,
      "quality": "short quality note",
      "useCase": "best editorial use",
      "searchPhrases": ["natural language searches this file should match"],
      "moments": [
        {
          "label": "short select label",
          "startSeconds": 0,
          "note": "why this moment may be useful"
        }
      ]
    }
  ]
}

Rules:
- Return one result for every file id.
- For text files, summarize the provided text preview and tag topics, entities, file purpose, and likely project use.
- For images, use the provided image preview.
- For videos, combine sampled frames with transcript text when provided. Be honest when only a few frames are available for a long video.
- Rate usefulness from 1 to 5 using clarity, uniqueness, completeness, and project value.
- Tags must be concise, lowercase, and useful for search.
- If sampled frames are too similar or unclear, say so in quality and keep the rating modest.
- Do not invent speech transcript or facts that are not visible in the frames.
`;
}

function buildContent(data) {
  const content = [{ type: "input_text", text: buildPrompt(data) }];
  for (const clip of data.clips) {
    content.push({ type: "input_text", text: `File ${clip.id}: ${clip.name}` });
    if (clip.text) {
      content.push({ type: "input_text", text: `Text preview for ${clip.name}:\n${String(clip.text).slice(0, 12000)}` });
    }
    if (clip.transcript) {
      content.push({
        type: "input_text",
        text: `Transcript or subtitle preview for ${clip.name}:\n${String(clip.transcript).slice(0, 12000)}`,
      });
    }
    for (const frame of clip.frames || []) {
      content.push({ type: "input_text", text: frame.label });
      content.push({ type: "input_image", image_url: frame.dataUrl, detail: "low" });
    }
  }
  return content;
}

function schema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      clips: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            summary: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            rating: { type: "number" },
            quality: { type: "string" },
            useCase: { type: "string" },
            searchPhrases: { type: "array", items: { type: "string" } },
            moments: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  label: { type: "string" },
                  startSeconds: { type: "number" },
                  note: { type: "string" },
                },
                required: ["label", "startSeconds", "note"],
              },
            },
          },
          required: ["id", "summary", "tags", "rating", "quality", "useCase", "searchPhrases", "moments"],
        },
      },
    },
    required: ["clips"],
  };
}

function validateAnalyzePayload(data) {
  if (!data.apiKey) throw new Error("Missing OpenAI API key.");
  if (!Array.isArray(data.clips) || !data.clips.length) throw new Error("Add footage before running AI indexing.");
  if (data.clips.length > 20) throw new Error("This request is too large. Loomark sends deep context in smaller batches.");
  for (const clip of data.clips) {
    if (!clip.id || !clip.name) throw new Error("File metadata is incomplete.");
    const hasFrames = Array.isArray(clip.frames) && clip.frames.length > 0;
    const hasText = typeof clip.text === "string" && clip.text.trim().length > 0;
    const hasTranscript = typeof clip.transcript === "string" && clip.transcript.trim().length > 0;
    if (!hasFrames && !hasText && !hasTranscript) throw new Error(`No readable context found for ${clip.name}.`);
    if (hasFrames && clip.frames.length > 5) throw new Error("Use 5 or fewer media samples per file.");
  }
}

async function callOpenAI(data) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${data.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: data.model || "gpt-5.5",
      store: false,
      input: [{ role: "user", content: buildContent(data) }],
      text: {
        format: {
          type: "json_schema",
          name: "footage_library_index",
          strict: true,
          schema: schema(),
        },
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "OpenAI request failed.");
  }
  return payload;
}

async function analyzeFootage(data) {
  validateAnalyzePayload(data);
  const payload = await callOpenAI(data);
  const parsed = parseJsonText(extractOutputText(payload));
  return {
    clips: parsed.clips || [],
    usage: payload.usage || null,
  };
}

module.exports = {
  analyzeFootage,
  validateAnalyzePayload,
};
