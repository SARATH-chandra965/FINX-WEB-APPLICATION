import { extractTextFromImage, isSupported } from "expo-text-extractor";
import type { Language } from "../types/scam";

export async function recognizeImageText(imageUri: string, _language: Language): Promise<string> {
  if (!isSupported) throw new Error("Text recognition is not supported on this device.");
  const blocks = await extractTextFromImage(imageUri);
  return blocks.join("\n");
}
