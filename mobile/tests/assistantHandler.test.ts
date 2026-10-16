import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../api/assistant";

function request(method: string, body?: unknown, address = "assistant-test-client"): Parameters<typeof handler>[0] {
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

describe("Gemini assistant API handler", () => {
  it("rejects unsupported methods and invalid or oversized conversation input", async () => {
    expect((await invoke(request("GET"))).statusCode).toBe(405);
    expect((await invoke(request("POST", "{bad json}"))).statusCode).toBe(400);
    expect((await invoke(request("POST", { language: "fr", messages: [{ role: "user", content: "hello" }] }))).statusCode).toBe(400);
    expect((await invoke(request("POST", { language: "en", messages: [{ role: "assistant", content: "hello" }] }))).statusCode).toBe(400);
    expect((await invoke(request("POST", { language: "en", messages: [{ role: "user", content: "x".repeat(1_501) }] }))).statusCode).toBe(400);
  });

  it("reports missing server configuration without contacting Gemini", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await invoke(request("POST", { language: "en", messages: [{ role: "user", content: "hello" }] }));
    expect(response.statusCode).toBe(503);
    expect(response.body).toEqual({ error: "Gemini assistant is not configured on this server." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls Gemini server-side and returns only bounded reply text", async () => {
    vi.stubEnv("GEMINI_API_KEY", "server-secret");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "Pause and verify through the official app." }] } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await invoke(request("POST", {
      language: "en",
      messages: [{ role: "user", content: "Is this request suspicious?" }],
    }, `assistant-success-${Date.now()}`));

    expect(response).toEqual({ statusCode: 200, body: { reply: "Pause and verify through the official app." } });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-goog-api-key": "server-secret" }),
        body: expect.stringContaining('"role":"user"'),
      }),
    );
    expect(fetchMock.mock.calls[0][0]).not.toContain("server-secret");
  });
});
