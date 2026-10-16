import { analyzeContent, isInputType } from "../src/services/scamDetector";
import type { AnalyzeRequest, AnalyzeResponse, Language } from "../src/types/scam";
import { analyzeWithGemini, createRuleFallback } from "./geminiAnalysis";

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

const MAX_CONTENT_LENGTH = 10_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const SUPPORTED_LANGUAGES: Language[] = ["en", "te", "hi", "ta", "kn"];
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const key = clientKey(req);
  const now = Date.now();
  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({ error: "Too many requests. Please wait and try again." });
    return;
  } else {
    current.count += 1;
  }
  if (rateLimitBuckets.size > 2_000) {
    for (const [bucketKey, bucket] of rateLimitBuckets) {
      if (bucket.resetAt <= now) rateLimitBuckets.delete(bucketKey);
    }
  }

  const body = typeof req.body === "string" ? parseBody(req.body) : req.body;
  if (!body || typeof body !== "object" || !("type" in body) || !("content" in body)) {
    res.status(400).json({ error: "Request must include a valid input type and content." });
    return;
  }

  const { type, content, language } = body as Record<string, unknown>;
  if (!isInputType(type) || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "Input type or content is invalid." });
    return;
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    res.status(413).json({ error: "Input exceeds the 10,000 character limit." });
    return;
  }
  if (language !== undefined && (typeof language !== "string" || !SUPPORTED_LANGUAGES.includes(language as Language))) {
    res.status(400).json({ error: "Language must be one of en, te, hi, ta, or kn." });
    return;
  }

  try {
    const input: AnalyzeRequest = {
      type,
      content,
      language: language === undefined ? "en" : language as Language,
    };
    const baseline = analyzeContent(input);
    let result: AnalyzeResponse["result"];
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      result = createRuleFallback(baseline);
    } else {
      try {
        result = await analyzeWithGemini(input, baseline, apiKey);
      } catch (error) {
        console.error("Gemini scan failed; returning a rule-based result.", error instanceof Error ? error.message : "Unknown provider error.");
        result = createRuleFallback(baseline);
      }
    }
    res.status(200).json({ result });
  } catch (error) {
    console.error("Scan analysis failed.", error instanceof Error ? error.message : "Unknown analysis error.");
    res.status(500).json({ error: "Analysis could not be completed." });
  }
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