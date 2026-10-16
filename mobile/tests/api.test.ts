import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeWithBackend, hasBackendConfiguration, isAnalyzeResponse } from "../src/services/api";
import type { AnalyzeResponse } from "../src/types/scam";

const validResponse: AnalyzeResponse = {
  result: {
    riskScore: 45,
    riskLevel: "medium",
    summary: "Some warning signs were found.",
    signals: [{ id: "payment", title: "Unexpected payment demand", explanation: "Verify payment requests." }],
    recommendations: ["Verify using an official channel."],
    analysisMethod: "backend-rules",
  },
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("analysis API contract", () => {
  it("accepts a valid structured backend result", () => {
    expect(isAnalyzeResponse(validResponse)).toBe(true);
    expect(isAnalyzeResponse({
      result: { ...validResponse.result, analysisNote: "ai-fallback" },
    })).toBe(true);
    expect(isAnalyzeResponse({
      result: { ...validResponse.result, analysisNote: "unexpected" },
    })).toBe(false);
  });

  it("rejects invalid scores and unbounded response shapes", () => {
    expect(isAnalyzeResponse({ result: { ...validResponse.result, riskScore: Number.NaN } })).toBe(false);
    expect(isAnalyzeResponse({ result: { ...validResponse.result, riskLevel: "certain" } })).toBe(false);
    expect(isAnalyzeResponse({ result: { ...validResponse.result, signals: Array(21).fill(validResponse.result.signals[0]) } })).toBe(false);
  });

  it("fails clearly when no backend URL is configured", async () => {
    vi.stubEnv("EXPO_PUBLIC_FINX_API_URL", "");
    await expect(analyzeWithBackend({ type: "message", content: "hello" })).rejects.toThrow(/not configured/i);
  });

  it("uses the current web origin for same-origin Vercel API routes", async () => {
    vi.stubEnv("EXPO_PUBLIC_FINX_API_URL", "");
    vi.stubGlobal("window", { location: { origin: "https://finx.vercel.app" } });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => validResponse,
    });
    vi.stubGlobal("fetch", fetchMock);

    expect(hasBackendConfiguration()).toBe(true);
    await analyzeWithBackend({ type: "message", content: "please review" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://finx.vercel.app/api/analyze",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("joins a configured site origin with the analysis route and parses a response", async () => {
    vi.stubEnv("EXPO_PUBLIC_FINX_API_URL", "https://finx.example/");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => validResponse,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await analyzeWithBackend({ type: "message", content: "please review" });
    expect(fetchMock).toHaveBeenCalledWith("https://finx.example/api/analyze", expect.objectContaining({ method: "POST" }));
    expect(result.method).toBe("backend-rules");
    expect(result.score).toBe(45);
  });

  it("preserves an explicit AI fallback note for the result screen", async () => {
    vi.stubEnv("EXPO_PUBLIC_FINX_API_URL", "https://finx.example");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { ...validResponse.result, analysisNote: "ai-fallback" } }),
    }));

    const analysis = await analyzeWithBackend({ type: "message", content: "please review" });
    expect(analysis.method).toBe("backend-rules");
    expect(analysis.analysisNote).toBe("ai-fallback");
  });

  it("sends the selected language and preserves model speech text", async () => {
    vi.stubEnv("EXPO_PUBLIC_FINX_API_URL", "https://finx.example");
    const speechText = "దయచేసి ఈ అభ్యర్థనను జాగ్రత్తగా పరిశీలించండి.";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: { ...validResponse.result, analysisMethod: "ai-provider", speechText },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const analysis = await analyzeWithBackend({ type: "message", content: "please review", language: "te" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({ language: "te" });
    expect(analysis.speechText).toBe(speechText);
  });

  it("reports a timeout rather than pretending the service succeeded", async () => {
    vi.stubEnv("EXPO_PUBLIC_FINX_API_URL", "https://finx.example");
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));

    const pending = analyzeWithBackend({ type: "message", content: "please review" });
    const assertion = expect(pending).rejects.toThrow(/timed out/i);
    await vi.advanceTimersByTimeAsync(18_000);
    await assertion;
  });
});
