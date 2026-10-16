import { describe, expect, it } from "vitest";
import { translate, translateSignal, translations } from "../src/constants/translations";

describe("localized interface strings", () => {
  it("provides the same complete set of interface keys in both languages", () => {
    expect(Object.keys(translations.te).sort()).toEqual(Object.keys(translations.en).sort());
    expect(translate("te", "signIn")).toBe("సైన్ ఇన్");
  });

  it("localizes detected warnings without discarding their explanations", () => {
    const translated = translateSignal("te", {
      id: "otp",
      title: "Request for a one-time password",
      explanation: "An OTP should not be disclosed.",
    });
    expect(translated.title).toMatch(/OTP/);
    expect(translated.explanation).toMatch(/OTP/);
  });

  it("offers Hindi, Tamil, and Kannada core screens with English fallback for remaining copy", () => {
    expect(translate("hi", "home")).toBe("होम");
    expect(translate("ta", "home")).toBe("முகப்பு");
    expect(translate("kn", "home")).toBe("ಮುಖಪುಟ");
    expect(translate("hi", "privacy")).not.toBe(translate("en", "privacy"));
    expect(translate("ta", "brand")).toBe(translate("en", "brand"));
  });

  it("localizes warning explanations in each added Indian language", () => {
    for (const language of ["hi", "ta", "kn"] as const) {
      const translated = translateSignal(language, {
        id: "otp",
        title: "Request for a one-time password",
        explanation: "An OTP should not be disclosed.",
      });
      expect(translated.title).not.toBe("Request for a one-time password");
      expect(translated.explanation).toMatch(/OTP/);
    }
  });
});
