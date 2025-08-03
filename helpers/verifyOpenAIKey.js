import { logEvent } from "./logEvent.js";

export function verifyOpenAIKey({ route, userIP }) {
  if (!process.env.OPENAI_API_KEY) {
    logEvent({
      route,
      action: "keyValidation",
      status: 500,
      userIP,
      message: "Missing OpenAI API Key",
    });
    return false;
  }
  return true;
}
