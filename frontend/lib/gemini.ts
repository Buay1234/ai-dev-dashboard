import "server-only";
import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from "@/lib/gemini-env";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({
      apiKey: getGeminiApiKey(),
    });
  }
  return client;
}

/** @deprecated Use getGeminiClient() — kept for existing imports */
export const gemini = new Proxy({} as GoogleGenAI, {
  get(_target, prop) {
    return Reflect.get(getGeminiClient(), prop, getGeminiClient());
  },
});
