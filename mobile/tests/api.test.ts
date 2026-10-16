import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeWithBackend, isAnalyzeResponse } from "../src/services/api";
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

  it("reports a timeout rather than pretending the service succeeded", async () => {
    vi.stubEnv("EXPO_PUBLIC_FINX_API_URL", "https://finx.example");
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));

    const pending = analyzeWithBackend({ type: "message", content: "please review" });
    const assertion = expect(pending).rejects.toThrow(/timed out/i);
    await vi.advanceTimersByTimeAsync(8_000);
    await assertion;
  });
});
