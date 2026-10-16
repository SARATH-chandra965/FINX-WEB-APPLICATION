import { describe, expect, it } from "vitest";
import handler from "../api/analyze";

function request(method: string, body?: unknown, address = "test-client"): Parameters<typeof handler>[0] {
  return { method, body, headers: { "x-forwarded-for": address } };
}

function invoke(req: Parameters<typeof handler>[0]) {
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
  handler(req, response);
  return { statusCode, body };
}

describe("analysis API handler", () => {
  it("rejects unsupported methods and malformed content", () => {
    expect(invoke(request("GET")).statusCode).toBe(405);
    expect(invoke(request("POST", "{bad json}", "malformed-client")).statusCode).toBe(400);
    expect(invoke(request("POST", { type: "image", content: "hello" }, "invalid-type-client")).statusCode).toBe(400);
  });

  it("returns a structured, rule-based result without exposing message content", () => {
    const response = invoke(request("POST", { type: "message", content: "Share your OTP now" }, "scan-client"));
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      result: {
        riskLevel: "medium",
        analysisMethod: "backend-rules",
        signals: [expect.objectContaining({ id: "otp", explanation: expect.any(String) })],
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("Share your OTP now");
  });

  it("rejects over-limit content", () => {
    expect(invoke(request("POST", { type: "message", content: "x".repeat(10_001) }, "large-client")).statusCode).toBe(413);
  });

  it("limits repeated requests per serverless instance and client key", () => {
    const client = `limit-${Date.now()}`;
    for (let index = 0; index < 20; index += 1) {
      expect(invoke(request("POST", { type: "message", content: "hello" }, client)).statusCode).toBe(200);
    }
    expect(invoke(request("POST", { type: "message", content: "hello" }, client)).statusCode).toBe(429);
  });
});
