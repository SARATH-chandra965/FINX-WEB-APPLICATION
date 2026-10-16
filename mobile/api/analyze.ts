import { analyzeContent, isInputType } from "../src/services/scamDetector";
import type { AnalyzeRequest, AnalyzeResponse } from "../src/types/scam";

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
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export default function handler(req: ApiRequest, res: ApiResponse): void {
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

  const { type, content } = body as Record<string, unknown>;
  if (!isInputType(type) || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "Input type or content is invalid." });
    return;
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    res.status(413).json({ error: "Input exceeds the 10,000 character limit." });
    return;
  }

  try {
    const analysis = analyzeContent({ type, content } satisfies AnalyzeRequest);
    const result: AnalyzeResponse["result"] = {
      riskScore: analysis.score,
      riskLevel: analysis.level,
      summary: analysis.summary,
      signals: analysis.signals,
      recommendations: analysis.recommendations,
      analysisMethod: "backend-rules",
    };
    res.status(200).json({ result });
  } catch {
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