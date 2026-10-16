import type { AnalyzeRequest, AnalyzeResponse, ScanResult, WarningSignal } from "../types/scam";

const REQUEST_TIMEOUT_MS = 18_000;
const MAX_CONTENT_LENGTH = 10_000;

export async function analyzeWithBackend(input: AnalyzeRequest): Promise<Omit<ScanResult, "id" | "analyzedAt">> {
  const baseUrl = getBackendBaseUrl();
  if (!baseUrl) throw new Error("Analysis service is not configured.");
  if (!input.content.trim()) throw new Error("Input content must not be empty.");
  if (input.content.length > MAX_CONTENT_LENGTH) throw new Error("Input content exceeds the 10,000 character limit.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(resolveEndpoint(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Analysis service returned HTTP ${response.status}.`);
    const data: unknown = await response.json();
    if (!isAnalyzeResponse(data)) throw new Error("Analysis service returned an invalid response.");
    const analysis = data.result;
    return {
      score: analysis.riskScore,
      level: analysis.riskLevel,
      summary: analysis.summary,
      signals: analysis.signals,
      recommendations: analysis.recommendations,
      method: analysis.analysisMethod,
      ...(analysis.analysisNote ? { analysisNote: analysis.analysisNote } : {}),
      ...(analysis.speechText ? { speechText: analysis.speechText } : {}),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Analysis service request timed out.");
    }
    throw error instanceof Error ? error : new Error("Analysis service request failed.");
  } finally {
    clearTimeout(timeout);
  }
}

export function isAnalyzeResponse(value: unknown): value is AnalyzeResponse {
  if (!value || typeof value !== "object" || !("result" in value)) return false;
  const result = value.result;
  if (!result || typeof result !== "object") return false;
  if (!("riskScore" in result) || typeof result.riskScore !== "number" || !Number.isFinite(result.riskScore) || result.riskScore < 0 || result.riskScore > 100) return false;
  if (!("riskLevel" in result) || (result.riskLevel !== "low" && result.riskLevel !== "medium" && result.riskLevel !== "high")) return false;
  const expectedLevel = result.riskScore >= 71 ? "high" : result.riskScore >= 31 ? "medium" : "low";
  if (result.riskLevel !== expectedLevel) return false;
  if (!("summary" in result) || typeof result.summary !== "string" || result.summary.length > 500) return false;
  if (!("signals" in result) || !Array.isArray(result.signals) || result.signals.length > 20 || !result.signals.every(isWarningSignal)) return false;
  if (new Set(result.signals.map((signal) => signal.id)).size !== result.signals.length) return false;
  if (!("recommendations" in result) || !Array.isArray(result.recommendations) || result.recommendations.length > 10 || !result.recommendations.every((item) => typeof item === "string" && item.length <= 500)) return false;
  if (!("analysisMethod" in result) || (result.analysisMethod !== "local-rules" && result.analysisMethod !== "backend-rules" && result.analysisMethod !== "ai-provider")) return false;
  if ("analysisNote" in result && result.analysisNote !== "ai-fallback") return false;
  if ("speechText" in result && (typeof result.speechText !== "string" || !result.speechText.trim() || result.speechText.length > 1_000)) return false;
  return !("modelVersion" in result) || typeof result.modelVersion === "string" && result.modelVersion.length <= 120;
}

function isWarningSignal(value: unknown): value is WarningSignal {
  return !!value && typeof value === "object"
    && "id" in value && typeof value.id === "string" && value.id.length <= 80
    && "title" in value && typeof value.title === "string" && value.title.length <= 300
    && "explanation" in value && typeof value.explanation === "string" && value.explanation.length <= 800;
}

export function hasBackendConfiguration(): boolean {
  return getBackendBaseUrl() !== null;
}

function getBackendBaseUrl(): string | null {
  const configuredUrl = process.env.EXPO_PUBLIC_FINX_API_URL?.trim();
  if (configuredUrl) return configuredUrl;
  if (typeof window !== "undefined" && /^https?:\/\//i.test(window.location.origin)) {
    return window.location.origin;
  }
  return null;
}

function resolveEndpoint(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, "");
  return normalized.endsWith("/api/analyze") ? normalized : `${normalized}/api/analyze`;
}