/**
 * Processes reaction images via Ollama cloud API (OpenAI-compatible vision) to generate descriptions and tags.
 *
 * Usage:
 *   npx tsx scripts/tag-reactions.ts [--concurrency=10] [--model=gemini-3-flash-preview:cloud] [--base-url=https://ollama.com/v1]
 *
 * Reads all images from packages/vscode/media/reactions/
 * Outputs packages/vscode/media/reactions/reactions.json
 *
 * Requires OLLAMA_API_KEY env var.
 */

import * as fs from "fs";
import * as path from "path";

const REACTIONS_DIR = path.resolve(
  __dirname,
  "../packages/vscode/media/reactions"
);
const OUTPUT_FILE = path.join(REACTIONS_DIR, "reactions.json");
const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
]);

const VALID_MOODS = [
  "angry",
  "disappointed",
  "frustrated",
  "disgusted",
  "shocked",
  "smug",
  "mocking",
  "crying",
  "celebrating",
  "confused",
  "judging",
  "panicking",
  "facepalm",
  "tired",
  "sarcastic",
  "impressed",
] as const;

const VALID_VERDICTS = [
  "commit-message",
  "branch-name",
  "commit-size",
  "risky-action",
  "session",
  "force-push",
  "push-to-main",
  "merge-conflict",
] as const;

const VALID_SEVERITIES = ["mild", "medium", "savage"] as const;

interface ReactionEntry {
  file: string;
  description: string;
  moods: string[];
  verdicts: string[];
  severity: string[];
}

interface ReactionManifest {
  generated: string;
  model: string;
  count: number;
  images: ReactionEntry[];
}

function parseArgs() {
  const args = process.argv.slice(2);
  let concurrency = 10;
  let model = "gemini-3-flash-preview:cloud";
  let baseUrl = "https://ollama.com/v1";

  for (const arg of args) {
    if (arg.startsWith("--concurrency=")) {
      concurrency = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--model=")) {
      model = arg.split("=")[1];
    } else if (arg.startsWith("--base-url=")) {
      baseUrl = arg.split("=")[1];
    }
  }

  return { concurrency, model, baseUrl };
}

function getImageFiles(): string[] {
  return fs
    .readdirSync(REACTIONS_DIR)
    .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort();
}

function imageToDataUrl(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
  };
  const mimeType = mimeMap[ext] || "image/png";
  const base64 = fs.readFileSync(filePath).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

const SYSTEM_PROMPT = `You are tagging reaction images for a VS Code extension called "Git Gud" that roasts developers for bad Git habits (like a toxic esports coach).

Analyze the provided reaction image and return a JSON object with these fields:

- "description": A SHORT description (max 10 words) of the reaction/emotion shown.
- "moods": Array of applicable moods from this list ONLY: ${JSON.stringify(VALID_MOODS)}
- "verdicts": Array of Git offense categories this reaction fits, from this list ONLY: ${JSON.stringify(VALID_VERDICTS)}. Pick the ones where this reaction image would make sense as a response to that type of offense.
- "severity": Array of roast intensity levels this image fits, from this list ONLY: ${JSON.stringify(VALID_SEVERITIES)}. A mild meme is light teasing, savage is extreme disappointment/anger.

Return ONLY the JSON object, no markdown fences, no extra text.`;

async function fetchCompletion(
  dataUrl: string,
  model: string,
  baseUrl: string,
  apiKey: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Tag this reaction image." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }

  const data = (await res.json()) as any;
  return data?.choices?.[0]?.message?.content?.trim() ?? "";
}

function parseResponse(rawText: string): any {
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  return JSON.parse(cleaned);
}

async function callOllama(
  imageFile: string,
  model: string,
  baseUrl: string,
  apiKey: string
): Promise<ReactionEntry> {
  const filePath = path.join(REACTIONS_DIR, imageFile);
  const dataUrl = imageToDataUrl(filePath);

  let parsed: any;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const rawText = await fetchCompletion(dataUrl, model, baseUrl, apiKey);
    try {
      parsed = parseResponse(rawText);
      break;
    } catch {
      if (attempt === maxAttempts) {
        throw new Error(
          `Failed to parse response for ${imageFile} after ${maxAttempts} attempts: ${rawText.slice(0, 120)}...`
        );
      }
      console.warn(`  Retry ${imageFile} (attempt ${attempt} got truncated response)`);
    }
  }

  return {
    file: imageFile,
    description: String(parsed.description || ""),
    moods: (parsed.moods || []).filter((m: string) =>
      (VALID_MOODS as readonly string[]).includes(m)
    ),
    verdicts: (parsed.verdicts || []).filter((v: string) =>
      (VALID_VERDICTS as readonly string[]).includes(v)
    ),
    severity: (parsed.severity || []).filter((s: string) =>
      (VALID_SEVERITIES as readonly string[]).includes(s)
    ),
  };
}

async function processInBatches(
  files: string[],
  concurrency: number,
  model: string,
  baseUrl: string,
  apiKey: string
): Promise<ReactionEntry[]> {
  const results: ReactionEntry[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchNum = Math.floor(i / concurrency) + 1;
    const totalBatches = Math.ceil(files.length / concurrency);
    console.log(
      `  Batch ${batchNum}/${totalBatches}: processing ${batch.join(", ")}`
    );

    const settled = await Promise.allSettled(
      batch.map((f) => callOllama(f, model, baseUrl, apiKey))
    );

    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        const msg = result.reason?.message || String(result.reason);
        errors.push(msg);
        console.error(`  ERROR: ${msg}`);
      }
    }
  }

  if (errors.length > 0) {
    console.warn(`\n${errors.length} image(s) failed processing.`);
  }

  return results;
}

async function main() {
  const apiKey = process.env.OLLAMA_API_KEY;
  if (!apiKey) {
    console.error("Error: OLLAMA_API_KEY environment variable is required.");
    console.error("  Set it with: set OLLAMA_API_KEY=your-key-here");
    process.exit(1);
  }

  const { concurrency, model, baseUrl } = parseArgs();
  const files = getImageFiles();

  if (files.length === 0) {
    console.error(
      `No images found in ${REACTIONS_DIR}\nAdd .png/.jpg/.gif/.webp images and re-run.`
    );
    process.exit(1);
  }

  console.log(`Found ${files.length} image(s) in ${REACTIONS_DIR}`);
  console.log(`Model: ${model} | Base URL: ${baseUrl} | Concurrency: ${concurrency}\n`);

  const images = await processInBatches(files, concurrency, model, baseUrl, apiKey);

  images.sort((a, b) => a.file.localeCompare(b.file));

  const manifest: ReactionManifest = {
    generated: new Date().toISOString(),
    model,
    count: images.length,
    images,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nWrote ${OUTPUT_FILE} (${images.length} entries)`);
}

main();
