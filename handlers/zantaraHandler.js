import { zantaraPrompt } from "../constants/prompts.js";
import { logEvent } from "../helpers/logEvent.js";
import { getUserIP } from "../helpers/getUserIP.js";
import { verifyOpenAIKey } from "../helpers/verifyOpenAIKey.js";

export async function zantaraHandler(req, res) {
  const route = "/api/zantara";
  const userIP = getUserIP(req);

  if (req.method !== "POST") {
    logEvent({ route, action: "methodCheck", status: 405, userIP, message: "Method Not Allowed" });
    return res.status(405).json({ success: false, error: { status: 405, summary: "Method Not Allowed" } });
  }

  if (!verifyOpenAIKey({ route, userIP })) {
    return res.status(500).json({ success: false, error: { status: 500, summary: "Missing OpenAI API Key" } });
  }

  if (!req.body || typeof req.body !== "object") {
    logEvent({ route, action: "payloadValidation", status: 400, userIP, message: "Invalid JSON payload" });
    return res.status(400).json({ success: false, error: { status: 400, summary: "Invalid JSON payload" } });
  }

  const { prompt, requester } = req.body;

  if (!prompt) {
    logEvent({ route, action: "promptValidation", status: 400, userIP, message: "Missing prompt in request body" });
    return res.status(400).json({ success: false, error: { status: 400, summary: "Missing prompt in request body" } });
  }

  if (requester && ["Ruslantara", "Deanto"].includes(requester)) {
    logEvent({ route, action: "blockedUser", status: 403, userIP, message: `Blocked requester: ${requester}` });
    return res.status(403).json({ success: false, error: { status: 403, summary: "Request denied" } });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: zantaraPrompt },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    logEvent({ route, action: "success", status: 200, userIP, summary: "Request completed successfully" });

    return res.status(200).json({
      success: true,
      data: {
        status: 200,
        summary: "Request completed successfully",
        response: data
      }
    });
  } catch (error) {
    console.error("Error fetching data from OpenAI:", error);
    logEvent({ route, action: "error", status: 500, userIP, message: "Internal Server Error" });
    return res.status(500).json({ success: false, error: { status: 500, summary: "Internal Server Error" } });
  }
}
