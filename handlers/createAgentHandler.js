import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { getAgentPrompt } from "../constants/prompts.js";

const log = (e) => console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  route: e.route,
  action: e.action,
  status: e.status,
  message: e.message,
  userIP: e.userIP,
  meta: e.meta || null
}));

export function createAgentHandler(agentName) {
  return async function handler(req, res) {
    const route = `/api/${agentName}`;
    const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

    if (req.method !== "POST") {
      log({ route, action: "methodCheck", status: 405, message: "Method Not Allowed", userIP });
      return res.status(405).json({
        success: false,
        status: 405,
        summary: "Method Not Allowed",
        error: "Method Not Allowed",
        nextStep: "Send a POST request"
      });
    }

    try {
      validateOpenAIKey();
    } catch (err) {
      log({ route, action: "keyValidation", status: 500, message: err.message, userIP });
      return res.status(500).json({
        success: false,
        status: 500,
        summary: err.message,
        error: err.message,
        nextStep: "Set OPENAI_API_KEY in environment"
      });
    }

    const { prompt, requester } = req.body || {};

    if (!prompt) {
      log({ route, action: "promptValidation", status: 400, message: "Missing prompt in request body", userIP });
      return res.status(400).json({
        success: false,
        status: 400,
        summary: "Missing prompt in request body",
        error: "Missing prompt in request body",
        nextStep: "Include prompt in JSON body"
      });
    }

    if (isBlockedRequester(requester)) {
      log({ route, action: "blockedRequester", status: 403, message: "Requester is blocked", userIP });
      return res.status(403).json({
        success: false,
        status: 403,
        summary: "Requester is blocked",
        error: "Access denied"
      });
    }

    const agentPrompt = getAgentPrompt(agentName);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: agentPrompt },
            { role: "user", content: prompt }
          ]
        })
      });

      const data = await response.json();

      log({ route, action: "success", status: 200, message: "Request completed successfully", userIP });

      return res.status(200).json({
        success: true,
        status: 200,
        summary: "Request completed successfully",
        data
      });
    } catch (error) {
      log({ route, action: "error", status: 500, message: "Internal Server Error", userIP, meta: error.message });
      return res.status(500).json({
        success: false,
        status: 500,
        summary: "Internal Server Error",
        error: "Internal Server Error",
        nextStep: "Check server logs and retry"
      });
    }
  };
}
