import type { InputType, RiskLevel, ScanInput, ScanResult, WarningSignal } from "../types/scam";

interface Rule {
  id: string;
  title: string;
  explanation: string;
  patterns: RegExp[];
  weight: number;
  types?: InputType[];
}

const rules: Rule[] = [
  { id: "otp", title: "Request for a one-time password", explanation: "Legitimate organizations should not ask you to disclose an OTP.", patterns: [/\b(?:share|send|tell|provide|read out)\b.{0,35}\b(?:otp|one[- ]time password)\b/i, /\b(?:otp|one[- ]time password)\b.{0,30}\b(?:share|send|tell|provide)\b/i, /(?:పంచండి|చెప్పండి|పంపండి|ఇవ్వండి).{0,30}(?:ఓటిపి|ఒటిపి|ఓటీపీ|ఒటీపీ)/i, /(?:बताएं|साझा करें|भेजें|दें).{0,30}(?:ओटीपी|एक बार का पासवर्ड|OTP)/i, /(?:ओटीपी|एक बार का पासवर्ड|OTP).{0,30}(?:बताएं|साझा करें|भेजें|दें)/i, /(?:பகிரவும்|அனுப்பவும்|சொல்லவும்|கொடுங்கள்).{0,30}(?:OTP|ஒருமுறை கடவுச்சொல்)/i, /(?:OTP|ஒருமுறை கடவுச்சொல்).{0,30}(?:பகிரவும்|அனுப்பவும்|சொல்லவும்|கொடுங்கள்)/i, /(?:ಹಂಚಿ|ಕಳುಹಿಸಿ|ಹೇಳಿ|ನೀಡಿ).{0,30}(?:OTP|ಒನ್ ಟೈಮ್ ಪಾಸ್‌ವರ್ಡ್)/i, /(?:OTP|ಒನ್ ಟೈಮ್ ಪಾಸ್‌ವರ್ಡ್).{0,30}(?:ಹಂಚಿ|ಕಳುಹಿಸಿ|ಹೇಳಿ|ನೀಡಿ)/i], weight: 32 },
  { id: "credentials", title: "Request for a password or security code", explanation: "A request to reveal a password, PIN, or CVV is a serious warning sign.", patterns: [/\b(?:password|passcode|cvv|cvc|pin)\b.{0,35}\b(?:share|send|provide|tell|confirm|enter)\b/i, /\b(?:share|send|provide|tell|confirm)\b.{0,35}\b(?:password|passcode|cvv|cvc|pin)\b/i, /(?:పంచండి|చెప్పండి|పంపండి|ఇవ్వండి).{0,30}(?:పాస్‌వర్డ్|పిన్|సీవీవీ)/i, /(?:बताएं|साझा करें|भेजें|दें).{0,30}(?:पासवर्ड|पिन|सीवीवी)/i, /(?:பகிரவும்|அனுப்பவும்|சொல்லவும்|கொடுங்கள்).{0,30}(?:கடவுச்சொல்|பின்|CVV)/i, /(?:ಹಂಚಿ|ಕಳುಹಿಸಿ|ಹೇಳಿ|ನೀಡಿ).{0,30}(?:ಪಾಸ್‌ವರ್ಡ್|ಪಿನ್|CVV)/i], weight: 32 },
  { id: "urgent", title: "Urgent threat or time pressure", explanation: "Scammers often pressure people to act before they can verify a claim.", patterns: [/\b(?:immediately|urgent|within \d+ hours?|final warning|act now|expires today)\b/i, /\baccount\b.{0,35}\b(?:blocked|suspended|closed|frozen)\b/i, /(?:వెంటనే|తక్షణం|అత్యవసరం).{0,40}(?:చెల్లించండి|పంపండి|లేకపోతే)/i, /(?:ఖాతా|అకౌంట్).{0,30}(?:నిలిపి|బ్లాక్|మూసి)/i, /(?:तुरंत|तत्काल|अभी|जल्दी).{0,35}(?:भेजें|भुगतान|वरना|बंद)/i, /(?:உடனே|அவசரம்|இப்போதே).{0,35}(?:செலுத்த|அனுப்பு|இல்லையெனில்)/i, /(?:ತಕ್ಷಣ|ತುರ್ತು|ಈಗಲೇ).{0,35}(?:ಪಾವತಿಸಿ|ಕಳುಹಿಸಿ|ಇಲ್ಲದಿದ್ದರೆ)/i], weight: 18 },
  { id: "payment", title: "Unexpected payment demand", explanation: "Verify payment requests using a known, official contact channel.", patterns: [/\b(?:pay|transfer|send)\b.{0,30}\b(?:money|fee|deposit|funds|payment)\b/i, /\b(?:processing fee|verification fee|advance payment)\b/i, /(?:డబ్బు|రుసుము|ఫీజు).{0,30}(?:చెల్లించండి|పంపండి|బదిలీ చేయండి)/i, /(?:पैसे|शुल्क|फीस|राशि).{0,30}(?:भेजें|जमा|भुगतान|भरें)/i, /(?:பணம்|கட்டணம்|தொகை).{0,30}(?:செலுத்த|அனுப்பு|கட்டவும்)/i, /(?:ಹಣ|ಶುಲ್ಕ|ಮೊತ್ತ).{0,30}(?:ಪಾವತಿಸಿ|ಕಳುಹಿಸಿ|ಜಮಾ)/i], weight: 24 },
  { id: "prize", title: "Unexpected prize or reward claim", explanation: "Unexpected prizes that require a fee or personal details may be fraudulent.", patterns: [/\b(?:you have won|winner|prize money|claim your reward|unexpected reward|congratulations)\b/i, /(?:బహుమతి|లాటరీ|ప్రైజ్).{0,35}(?:గెలిచారు|గెలిచావు|వచ్చింది|పొందారు)/i, /(?:इनाम|लॉटरी|पुरस्कार).{0,35}(?:जीते|जीता|मिला|बधाई)/i, /(?:பரிசு|லாட்டரி|வெற்றி).{0,35}(?:வென்ற|கிடைத்த|வாழ்த்துகள்)/i, /(?:ಬಹುಮಾನ|ಲಾಟರಿ|ಗೆಲುವು).{0,35}(?:ಗೆದ್ದ|ಸಿಕ್ಕಿದೆ|ಅಭಿನಂದನೆ)/i], weight: 20 },
  { id: "banking", title: "Possible banking impersonation", explanation: "Contact your bank using the number on your card or its official app, not a number in an unexpected message.", patterns: [/\b(?:bank|account|kyc)\b.{0,40}\b(?:verify|verification|update|suspend|blocked|details)\b/i, /\b(?:bank manager|bank support|bank security)\b/i], weight: 20 },
  { id: "authority", title: "Authority or government impersonation", explanation: "Government agencies do not resolve unexpected threats through secret payments or messaging pressure.", patterns: [/\b(?:police officer|government officer|income tax department|customs officer|digital arrest)\b/i], weight: 22 },
  { id: "install", title: "Request to install an unknown application", explanation: "Installing an app from an unsolicited link can expose your device and accounts.", patterns: [/\b(?:install|download)\b.{0,45}\b(?:app|application|apk|remote access|screen sharing)\b/i], weight: 22 },
  { id: "investment", title: "Potentially suspicious investment offer", explanation: "Guaranteed returns and pressure to invest quickly are common warning signs. Check the offer with a regulated, independent source.", patterns: [/\b(?:guaranteed|assured|risk[- ]free)\b.{0,40}\b(?:return|profit|investment|income)\b/i, /\b(?:double|triple)\b.{0,20}\b(?:your money|investment|returns)\b/i], weight: 22 },
  { id: "job", title: "Potentially suspicious job offer", explanation: "Be cautious if a job offer asks for an upfront fee, sensitive documents, or an immediate payment.", patterns: [/\b(?:job|work|employment|offer letter)\b.{0,50}\b(?:registration fee|security deposit|training fee|pay first|upfront fee)\b/i, /\b(?:registration fee|security deposit|training fee)\b.{0,40}\b(?:job|work|salary|interview)\b/i], weight: 22 },
  { id: "social-pressure", title: "Pressure to keep the request secret or act quickly", explanation: "Isolation and urgency can make it harder to verify a request. Contact someone you trust before acting.", patterns: [/\b(?:keep this secret|do not tell anyone|don't tell anyone|act immediately|do this right now)\b/i], weight: 16 },
  { id: "link", title: "URL with potentially risky characteristics", explanation: "Shortened, non-HTTPS, or lookalike URLs can hide the destination. Do not open a link to test it.", patterns: [/\bhttp:\/\/[^\s]+/i, /\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|cutt\.ly)\/\S+/i, /\b(?:login|verify|secure|account)[.-][a-z0-9-]+\.(?:com|net|org|in)\b/i, /\bhttps?:\/\/(?:[^/@\s]+@)?\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?/i, /\bhttps?:\/\/[^/\s]*xn--[a-z0-9-]+/i], weight: 25, types: ["url", "message", "transcript"] },
  { id: "link-action", title: "Prompt to open or verify through a link", explanation: "Unexpected links asking you to sign in or verify details should be checked independently.", patterns: [/\b(?:click|tap|open)\b.{0,30}\b(?:link|here|below)\b/i, /\bverify\b.{0,30}\b(?:link|website|url)\b/i], weight: 15 },
];

export function analyzeContent(input: ScanInput): Omit<ScanResult, "id" | "analyzedAt"> {
  if (!input || !isInputType(input.type) || typeof input.content !== "string") {
    throw new Error("Input type or content is invalid.");
  }
  const content = input.content.trim();
  if (!content) throw new Error("Input content must not be empty.");
  if (content.length > 10_000) throw new Error("Input content exceeds the 10,000 character limit.");

  const signals: WarningSignal[] = [];
  let score = 0;
  for (const rule of rules) {
    if (rule.types && !rule.types.includes(input.type)) continue;
    if (rule.patterns.some((pattern) => pattern.test(content))) {
      signals.push({ id: rule.id, title: rule.title, explanation: rule.explanation });
      score += rule.weight;
    }
  }

  return formatAnalysis(score, signals, "local-rules");
}

export function formatAnalysis(
  rawScore: number,
  signals: WarningSignal[],
  method: "local-rules" | "backend-rules" | "ai-provider",
): Omit<ScanResult, "id" | "analyzedAt"> {
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const level: RiskLevel = score >= 71 ? "high" : score >= 31 ? "medium" : "low";
  const recommendations = level === "high"
    ? ["Do not click links, install software, share credentials, or send money.", "Verify the claim using an official app or a contact detail you already trust."]
    : level === "medium"
      ? ["Pause before acting and verify the sender independently.", "Do not share sensitive information or pay an unexpected fee."]
      : ["No configured warning patterns were detected; this does not prove the content is safe.", "Verify unexpected requests through an official, independently sourced channel."];

  const summary = level === "high"
    ? "High risk: do not share money, passwords, PINs, or OTPs."
    : level === "medium"
      ? "Some warning signs were found. Pause and verify independently."
      : "Few configured warning signs were found; this does not prove the content is safe.";
  return { score, level, summary, signals, recommendations, method };
}

export function getRuleSignalDefinition(id: string): WarningSignal | null {
  const rule = rules.find((candidate) => candidate.id === id);
  return rule ? { id: rule.id, title: rule.title, explanation: rule.explanation } : null;
}

export function getKnownRuleSignalIds(): string[] {
  return rules.map((rule) => rule.id);
}

export function isInputType(value: unknown): value is InputType {
  return value === "message" || value === "url" || value === "transcript";
}