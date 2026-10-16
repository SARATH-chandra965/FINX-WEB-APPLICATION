import { describe, expect, it } from "vitest";
import { analyzeContent } from "../src/services/scamDetector";

describe("analyzeContent", () => {
  it("does not flag an ordinary appointment message", () => {
    const result = analyzeContent({ type: "message", content: "Hello, your appointment is confirmed for tomorrow at 10 AM." });
    expect(result.level).toBe("low");
    expect(result.score).toBe(0);
    expect(result.signals).toHaveLength(0);
  });

  it("flags an OTP disclosure request with an explanation", () => {
    const result = analyzeContent({ type: "message", content: "Please share your OTP to verify your account." });
    expect(result.signals.map((signal) => signal.id)).toContain("otp");
    expect(result.signals.find((signal) => signal.id === "otp")?.explanation).toBeTruthy();
  });

  it("combines urgent account threats with payment demands", () => {
    const result = analyzeContent({ type: "message", content: "Urgent: your account will be blocked. Pay the processing fee immediately." });
    expect(result.level).toBe("medium");
    expect(result.signals.map((signal) => signal.id)).toEqual(expect.arrayContaining(["urgent", "payment"]));
  });

  it("flags shortened URLs without opening or fetching them", () => {
    const result = analyzeContent({ type: "url", content: "https://bit.ly/claim-prize" });
    expect(result.signals.map((signal) => signal.id)).toContain("link");
  });

  it("recognizes urgent payment offers written in Telugu", () => {
    const result = analyzeContent({ type: "message", content: "వెంటనే డబ్బు చెల్లించండి, లేకపోతే మీ ఖాతా బ్లాక్ అవుతుంది." });
    expect(result.signals.map((signal) => signal.id)).toEqual(expect.arrayContaining(["payment", "urgent"]));
  });

  it.each([
    ["Hindi", "कृपया अपना OTP साझा करें"],
    ["Tamil", "உங்கள் OTP பகிரவும்"],
    ["Kannada", "ನಿಮ್ಮ OTP ಹಂಚಿ"],
  ])("recognizes OTP requests written in %s", (_language, content) => {
    const result = analyzeContent({ type: "message", content });
    expect(result.signals.map((signal) => signal.id)).toContain("otp");
  });

  it("deduplicates a matching signal when the message repeats the request", () => {
    const result = analyzeContent({ type: "message", content: "Share your OTP. Please share your OTP again." });
    expect(result.signals.filter((signal) => signal.id === "otp")).toHaveLength(1);
  });

  it("rejects empty and over-limit content", () => {
    expect(() => analyzeContent({ type: "message", content: " " })).toThrow(/empty/i);
    expect(() => analyzeContent({ type: "message", content: "x".repeat(10_001) })).toThrow(/10,000/i);
  });
});
