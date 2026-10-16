import { afterEach, describe, expect, it, vi } from "vitest";
import { askGemini, isAssistantResponse } from "../src/services/assistantApi";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("assistant API client", () => {
  it("accepts only a bounded, non-empty response", () => {
    expect(isAssistantResponse({ reply: "Pause and verify." })).toBe(true);
    expect(isAssistantResponse({ reply: "" })).toBe(false);
    expect(isAssistantResponse({ reply: "x".repeat(2_001) })).toBe(false);
  });

  it("requires a configured backend and validates chat messages", async () => {
    vi.stubEnv("EXPO_PUBLIC_FINX_API_URL", "");
    await expect(askGemini({ language: "en", messages: [{ role: "user", content: "hello" }] })).rejects.toThrow(/not configured/i);
    vi.stubEnv("EXPO_PUBLIC_FINX_API_URL", "https://finx.example");
    await expect(askGemini({ language: "en", messages: [{ role: "user", content: "x".repeat(1_501) }] })).rejects.toThrow(/invalid|limit/i);
  });

  it("posts the conversation to the assistant endpoint", async () => {
    vi.stubEnv("EXPO_PUBLIC_FINX_API_URL", "https://finx.example/");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reply: "Please verify independently." }) });
    vi.stubGlobal("fetch", fetchMock);
    const reply = await askGemini({ language: "hi", messages: [{ role: "user", content: "क्या यह सुरक्षित है?" }] });

    expect(reply).toBe("Please verify independently.");
    expect(fetchMock).toHaveBeenCalledWith("https://finx.example/api/assistant", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ language: "hi", messages: [{ role: "user", content: "क्या यह सुरक्षित है?" }] }),
    }));
  });
});
