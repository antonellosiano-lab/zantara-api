import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { getAgentPrompt } from "../constants/prompts.js";
import { z } from "zod";
import { isRateLimited } from "../helpers/rateLimiter.js";
import { isDuplicateRequest } from "../helpers/idempotency.js";

export function createAgentHandler(agentName) {
  const bodySchema = z.object({
    prompt: z.string(),
    requester: z.string().optional()
  });

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

    const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "")
      .split(",")[0]
      .trim();

    if (await isRateLimited(ip, agentName)) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route: `/api/${agentName}`,
          action: "rateLimit",
          status: 429,
          userIP: ip,
          message: "Rate limit exceeded"
        })
      );
      return res.status(429).json({
        success: false,
        status: 429,
        summary: "Rate limit exceeded",
        error: "Too Many Requests",
        nextStep: "Wait before retrying"
      });
    }

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route: `/api/${agentName}`,
          action: "bodyValidation",
          status: 400,
          userIP: ip,
          message: "Invalid request body"
        })
      );
      return res.status(400).json({
        success: false,
        status: 400,
        summary: "Invalid request body",
        error: "Invalid request body",
        nextStep: "Provide prompt in JSON body"
      });
    }

    const { prompt, requester } = parsed.data;

    if (isBlockedRequester(requester)) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route: `/api/${agentName}`,
          action: "blockedRequester",
          status: 403,
          userIP: ip,
          message: "Requester is blocked"
        })
      );
      return res.status(403).json({
        success: false,
        status: 403,
        summary: "Requester is blocked",
        error: "Access denied"
      });
    }

    if (await isDuplicateRequest(req.body)) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route: `/api/${agentName}`,
          action: "idempotency",
          status: 409,
          userIP: ip,
          message: "Duplicate request"
        })
      );
      return res.status(409).json({
        success: false,
        status: 409,
        summary: "Duplicate request",
        error: "Duplicate request",
        nextStep: "Modify request and retry"
      });
    }

    const agentPrompt = getAgentPrompt(agentName);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
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
