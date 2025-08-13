import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { postToWebhook } from "../helpers/postToWebhook.js";

const log = (e) => console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  route: e.route,
  action: e.action,
  status: e.status,
  message: e.message,
  userIP: e.userIP,
  meta: e.meta || null
}));

export async function testTriggerHandler(req, res) {
  const route = "/api/make/test-trigger";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  if (req.method !== "POST") {
    log({ route, action: "methodCheck", status: 405, message: "Method Not Allowed", userIP });
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
    log({ route, action: "keyValidation", status: 500, message: err.message, userIP });
    return res.status(500).json({
      success: false,
      status: 500,
      summary: err.message,
      error: err.message,
      nextStep: "Set OPENAI_API_KEY in environment",
    });
  }

  const { webhook_url, payload, requester } = req.body || {};

  if (!webhook_url || !payload) {
    log({ route, action: "validation", status: 400, message: "Missing webhook_url or payload", userIP });
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing webhook_url or payload",
      error: "Missing webhook_url or payload",
      nextStep: "Provide webhook_url and payload",
    });
  }

  if (isBlockedRequester(requester)) {
    log({ route, action: "blockedRequester", status: 403, message: "Requester is blocked", userIP });
    return res.status(403).json({
      success: false,
      status: 403,
      summary: "Requester is blocked",
      error: "Access denied",
    });
  }

  try {
    const data = await postToWebhook(webhook_url, payload);
    log({ route, action: "success", status: 200, message: "Webhook triggered", userIP });
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Webhook triggered",
      data,
    });
  } catch (error) {
    log({ route, action: "error", status: 500, message: "Internal Server Error", userIP, meta: error.message });
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Internal Server Error",
      error: "Internal Server Error",
      nextStep: "Check server logs and retry",
    });
  }
}
