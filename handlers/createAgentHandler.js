import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { getAgentPrompt } from "../constants/prompts.js";

export function createAgentHandler(agentName) {
  return async function handler(req, res) {
    if (req.method !== "POST") {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        route: `/api/${agentName}`,
        action: "methodCheck",
        status: 405,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Method Not Allowed"
      }));
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
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        route: `/api/${agentName}`,
        action: "keyValidation",
        status: 500,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: err.message
      }));
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
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        route: `/api/${agentName}`,
        action: "promptValidation",
        status: 400,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Missing prompt in request body"
      }));
      return res.status(400).json({
        success: false,
        status: 400,
        summary: "Missing prompt in request body",
        error: "Missing prompt in request body",
        nextStep: "Include prompt in JSON body"
      });
    }

    if (isBlockedRequester(requester)) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        route: `/api/${agentName}`,
        action: "blockedRequester",
        status: 403,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Requester is blocked"
      }));
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
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
          "Notion-Version": "2022-06-28"
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

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        route: `/api/${agentName}`,
        action: "success",
        status: 200,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        summary: "Request completed successfully"
      }));

      return res.status(200).json({
        success: true,
        status: 200,
        summary: "Request completed successfully",
        data
      });
    } catch (error) {
      console.error("Error fetching data from OpenAI:", error);
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        route: `/api/${agentName}`,
        action: "error",
        status: 500,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Internal Server Error"
      }));
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
