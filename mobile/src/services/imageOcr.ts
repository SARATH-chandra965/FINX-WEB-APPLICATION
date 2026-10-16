import type { Language } from "../types/scam";

export async function recognizeImageText(_imageUri: string, _language: Language): Promise<string> {
  throw new Error("On-device text recognition is only available in the native app.");
}
