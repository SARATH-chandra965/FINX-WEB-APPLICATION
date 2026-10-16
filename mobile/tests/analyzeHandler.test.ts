import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../api/analyze";

function request(method: string, body?: unknown, address = "test-client"): Parameters<typeof handler>[0] {
  return { method, body, headers: { "x-forwarded-for": address } };
}

async function invoke(req: Parameters<typeof handler>[0]) {
  let statusCode = 200;
  let body: unknown;
  const response: Parameters<typeof handler>[1] = {
    status(code) {
      statusCode = code;
      return response;
    },
    json(value) {
      body = value;
    },
  };
  await handler(req, response);
  return { statusCode, body };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("analysis API handler", () => {
  it("rejects unsupported methods and malformed content", async () => {
    expect((await invoke(request("GET"))).statusCode).toBe(405);
    expect((await invoke(request("POST", "{bad json}", "malformed-client"))).statusCode).toBe(400);
    expect((await invoke(request("POST", { type: "image", content: "hello" }, "invalid-type-client"))).statusCode).toBe(400);
    expect((await invoke(request("POST", { type: "message", content: "hello", language: "xx" }, "invalid-language-client"))).statusCode).toBe(400);
  });

  it("returns an explicit rule-based fallback without exposing message content when Gemini is not configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const response = await invoke(request("POST", { type: "message", content: "Share your OTP now" }, "scan-client"));
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      result: {
        riskLevel: "medium",
        analysisMethod: "backend-rules",
        analysisNote: "ai-fallback",
        signals: [expect.objectContaining({ id: "otp", explanation: expect.any(String) })],
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("Share your OTP now");
  });

  it("uses Gemini's evidence-backed signals and combines its score with the rule baseline", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-server-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                riskScore: 75,
                signals: [{ id: "social-pressure", evidence: "keep this between us" }],
                speechText: "ఈ అభ్యర్థన అనుమానాస్పదంగా ఉంది. చర్య తీసుకునే ముందు అధికారిక మార్గంలో తనిఖీ చేయండి.",
              }),
            }],
          },
        }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await invoke(request("POST", {
      type: "message",
      content: "Please keep this between us",
      language: "te",
    }, "gemini-client"));

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      result: {
        riskLevel: "medium",
        analysisMethod: "ai-provider",
        modelVersion: "gemini-2.5-flash",
        speechText: "ఈ అభ్యర్థన అనుమానాస్పదంగా ఉంది. చర్య తీసుకునే ముందు అధికారిక మార్గంలో తనిఖీ చేయండి.",
        signals: [expect.objectContaining({ id: "social-pressure" })],
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/models/gemini-2.5-flash:generateContent"),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-goog-api-key": "test-server-key" }),
        body: expect.stringContaining("Telugu"),
      }),
    );
    expect(JSON.stringify(response.body)).not.toContain("Please keep this between us");
  });

  it("falls back to explainable rules if Gemini returns unsupported evidence", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-server-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                riskScore: 99,
                signals: [{ id: "payment", evidence: "text that is not present" }],
                speechText: "This message seems suspicious. Verify it independently.",
              }),
            }],
          },
        }],
      }),
    }));

    const response = await invoke(request("POST", { type: "message", content: "Hello there" }, "bad-evidence-client"));
    expect(response.body).toMatchObject({
      result: {
        analysisMethod: "backend-rules",
        analysisNote: "ai-fallback",
        riskScore: 0,
      },
    });
  });

  it("rejects over-limit content", async () => {
    expect((await invoke(request("POST", { type: "message", content: "x".repeat(10_001) }, "large-client"))).statusCode).toBe(413);
  });

  it("limits repeated requests per serverless instance and client key", async () => {
    const client = `limit-${Date.now()}`;
    for (let index = 0; index < 20; index += 1) {
      expect((await invoke(request("POST", { type: "message", content: "hello" }, client))).statusCode).toBe(200);
    }
    expect((await invoke(request("POST", { type: "message", content: "hello" }, client))).statusCode).toBe(429);
  });
});
