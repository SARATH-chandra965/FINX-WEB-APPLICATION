import type { Language } from "../src/types/scam";

interface ApiRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const SUPPORTED_LANGUAGES: Language[] = ["en", "te", "hi", "ta", "kn"];
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1_500;
const MAX_TOTAL_LENGTH = 5_000;
const MAX_REPLY_LENGTH = 2_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const REQUEST_TIMEOUT_MS = 25_000;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const body = typeof req.body === "string" ? parseBody(req.body) : req.body;
  const request = validateRequest(body);
  if (!request) {
    res.status(400).json({ error: "A supported language and valid conversation messages are required." });
    return;
  }
  if (!process.env.GEMINI_API_KEY?.trim()) {
    res.status(503).json({ error: "Gemini assistant is not configured on this server." });
    return;
  }
  if (isRateLimited(req)) {
    res.status(429).json({ error: "Too many assistant requests. Please wait and try again." });
    return;
  }

  try {
    const reply = await generateReply(request);
    res.status(200).json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini assistant request failed.";
    const status = message === "Gemini assistant timed out." ? 504 : 502;
    res.status(status).json({ error: message === "Gemini assistant timed out." ? "Gemini assistant timed out. Please try again." : "Gemini assistant could not respond right now. Please try again." });
  }
}

async function generateReply(request: { messages: ConversationMessage[]; language: Language }): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `You are FINX, a careful digital safety assistant. Reply in the language with code "${request.language}". Give practical, calm guidance about suspicious messages, scams, privacy, and online safety. Do not claim certainty or guarantee that something is safe. Never request or repeat passwords, OTPs, PINs, payment details, or other secrets. Encourage independent verification through official channels. Keep answers concise and do not pretend to contact authorities or perform actions.`,
          }],
        },
        contents: request.messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: { maxOutputTokens: 700, temperature: 0.4 },
      }),
    });
    if (!response.ok) throw new Error(`Gemini returned HTTP ${response.status}.`);

    const data: unknown = await response.json();
    const reply = extractReply(data);
    if (!reply) throw new Error("Gemini returned no usable text.");
    return reply;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Gemini assistant timed out.");
    throw error instanceof Error ? error : new Error("Gemini assistant request failed.");
  } finally {
    clearTimeout(timeout);
  }
}

function extractReply(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("candidates" in value) || !Array.isArray(value.candidates)) return null;
  const candidate = value.candidates[0];
  if (!candidate || typeof candidate !== "object" || !("content" in candidate) || !candidate.content
    || typeof candidate.content !== "object" || !("parts" in candidate.content) || !Array.isArray(candidate.content.parts)) return null;
  const parts: unknown[] = candidate.content.parts;
  const text = parts
    .filter((part: unknown): part is { text: string } => !!part && typeof part === "object" && "text" in part && typeof part.text === "string")
    .map((part: { text: string }) => part.text)
    .join("")
    .trim();
  return text && text.length <= MAX_REPLY_LENGTH ? text : null;
}

function validateRequest(value: unknown): { messages: ConversationMessage[]; language: Language } | null {
  if (!value || typeof value !== "object" || !("messages" in value) || !Array.isArray(value.messages)
    || !("language" in value) || typeof value.language !== "string"
    || !SUPPORTED_LANGUAGES.includes(value.language as Language)
    || value.messages.length < 1 || value.messages.length > MAX_MESSAGES) return null;

  let totalLength = 0;
  const messages: ConversationMessage[] = [];
  for (const item of value.messages) {
    if (!item || typeof item !== "object" || !("role" in item) || (item.role !== "user" && item.role !== "assistant")
      || !("content" in item) || typeof item.content !== "string" || !item.content.trim()
      || item.content.length > MAX_MESSAGE_LENGTH) return null;
    totalLength += item.content.length;
    if (totalLength > MAX_TOTAL_LENGTH) return null;
    messages.push({ role: item.role, content: item.content });
  }
  if (messages[messages.length - 1]?.role !== "user") return null;
  return { messages, language: value.language as Language };
}

function isRateLimited(req: ApiRequest): boolean {
  const key = clientKey(req);
  const now = Date.now();
  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) return true;
  current.count += 1;
  if (rateLimitBuckets.size > 2_000) {
    for (const [bucketKey, bucket] of rateLimitBuckets) {
      if (bucket.resetAt <= now) rateLimitBuckets.delete(bucketKey);
    }
  }
  return false;
}

function clientKey(req: ApiRequest): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0]?.split(",")[0] : forwarded?.split(",")[0];
  return ip?.trim() || req.socket?.remoteAddress || "unknown";
}

function parseBody(serialized: string): unknown {
  try {
    return JSON.parse(serialized) as unknown;
  } catch {
    return null;
  }
}
