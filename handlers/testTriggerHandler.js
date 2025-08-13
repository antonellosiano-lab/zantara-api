import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { postToWebhook } from "../helpers/postToWebhook.js";
import { z } from "zod";
import { isRateLimited } from "../helpers/rateLimiter.js";
import { isDuplicateRequest } from "../helpers/idempotency.js";

export async function testTriggerHandler(req, res) {
  if (req.method !== "POST") {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/make/test-trigger",
        action: "methodCheck",
        status: 405,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Method Not Allowed",
      })
    );
    return res.status(405).json({
      success: false,
      status: 405,
      summary: "Method Not Allowed",
      error: "Method Not Allowed",
      nextStep: "Send a POST request",
    });
  }

  try {
    validateOpenAIKey();
  } catch (err) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/make/test-trigger",
        action: "keyValidation",
        status: 500,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: err.message,
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: err.message,
      error: err.message,
      nextStep: "Set OPENAI_API_KEY in environment",
    });
  }

  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "")
    .split(",")[0]
    .trim();

  if (await isRateLimited(ip, "test-trigger")) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/make/test-trigger",
        action: "rateLimit",
        status: 429,
        userIP: ip,
        message: "Rate limit exceeded",
      })
    );
    return res.status(429).json({
      success: false,
      status: 429,
      summary: "Rate limit exceeded",
      error: "Too Many Requests",
      nextStep: "Wait before retrying",
    });
  }

  const bodySchema = z.object({
    webhook_url: z.string().url(),
    payload: z.any(),
    requester: z.string().optional(),
  });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/make/test-trigger",
        action: "bodyValidation",
        status: 400,
        userIP: ip,
        message: "Invalid request body",
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Invalid request body",
      error: "Invalid request body",
      nextStep: "Provide webhook_url and payload",
    });
  }

  const { webhook_url, payload, requester } = parsed.data;

  if (isBlockedRequester(requester)) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/make/test-trigger",
        action: "blockedRequester",
        status: 403,
        userIP: ip,
        message: "Requester is blocked",
      })
    );
    return res.status(403).json({
      success: false,
      status: 403,
      summary: "Requester is blocked",
      error: "Access denied",
    });
  }

  if (await isDuplicateRequest(req.body)) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/make/test-trigger",
        action: "idempotency",
        status: 409,
        userIP: ip,
        message: "Duplicate request",
      })
    );
    return res.status(409).json({
      success: false,
      status: 409,
      summary: "Duplicate request",
      error: "Duplicate request",
      nextStep: "Modify request and retry",
    });
  }

  try {
    const data = await postToWebhook(webhook_url, payload);
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/make/test-trigger",
        action: "success",
        status: 200,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        summary: "Webhook triggered",
      })
    );
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Webhook triggered",
      data,
    });
  } catch (error) {
    console.error("Error triggering webhook:", error);
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/make/test-trigger",
        action: "error",
        status: 500,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Internal Server Error",
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Internal Server Error",
      error: "Internal Server Error",
      nextStep: "Check server logs and retry",
    });
  }
}
