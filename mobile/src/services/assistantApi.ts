import type { Language } from "../types/scam";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantRequest {
  messages: AssistantMessage[];
  language: Language;
}

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1_500;
const MAX_REPLY_LENGTH = 2_000;

export async function askGemini(input: AssistantRequest): Promise<string> {
  const baseUrl = process.env.EXPO_PUBLIC_FINX_API_URL?.trim();
  if (!baseUrl) throw new Error("Gemini assistant is not configured. Set the FINX API URL and deploy the assistant endpoint.");
  validateMessages(input.messages);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(resolveEndpoint(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    const data: unknown = await response.json();
    if (!response.ok) {
      const message = getErrorMessage(data);
      throw new Error(message ?? `Gemini assistant returned HTTP ${response.status}.`);
    }
    if (!isAssistantResponse(data)) throw new Error("Gemini assistant returned an invalid response.");
    return data.reply;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Gemini assistant request timed out. Please try again.");
    throw error instanceof Error ? error : new Error("Gemini assistant request failed.");
  } finally {
    clearTimeout(timeout);
  }
}

export function isAssistantResponse(value: unknown): value is { reply: string } {
  return !!value && typeof value === "object" && "reply" in value
    && typeof value.reply === "string" && value.reply.trim().length > 0 && value.reply.length <= MAX_REPLY_LENGTH;
}

function validateMessages(messages: AssistantMessage[]): void {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    throw new Error("Conversation must contain between 1 and 12 messages.");
  }
  if (!messages.every((message) => (
    !!message && (message.role === "user" || message.role === "assistant")
    && typeof message.content === "string" && !!message.content.trim()
    && message.content.length <= MAX_MESSAGE_LENGTH
  ))) {
    throw new Error("A conversation message is invalid or exceeds the 1,500 character limit.");
  }
}

function getErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("error" in value)) return null;
  return typeof value.error === "string" ? value.error : null;
}

function resolveEndpoint(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, "");
  return normalized.endsWith("/api/assistant") ? normalized : `${normalized}/api/assistant`;
}
