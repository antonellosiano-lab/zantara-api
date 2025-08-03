import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { postToWebhook } from "../helpers/postToWebhook.js";

export async function testTriggerHandler(req, res) {
  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/test-trigger",
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
      route: "/api/make/test-trigger",
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

  const { webhook_url, payload, requester } = req.body || {};

  if (!webhook_url || !payload) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/test-trigger",
      action: "validation",
      status: 400,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Missing webhook_url or payload"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing webhook_url or payload",
      error: "Missing webhook_url or payload",
      nextStep: "Provide webhook_url and payload"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/test-trigger",
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

  try {
    const data = await postToWebhook(webhook_url, payload);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/test-trigger",
      action: "success",
      status: 200,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      summary: "Webhook triggered"
    }));
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Webhook triggered",
      data
    });
  } catch (error) {
    console.error("Error triggering webhook:", error);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/test-trigger",
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
}
