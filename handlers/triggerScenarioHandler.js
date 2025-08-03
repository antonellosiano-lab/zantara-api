import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { postToWebhook } from "../helpers/postToWebhook.js";

export async function triggerScenarioHandler(req, res) {
  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/trigger-scenario",
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
      route: "/api/make/trigger-scenario",
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

  const { scenario_id, webhook_url, payload, requester } = req.body || {};

  if (!scenario_id || !webhook_url || !payload) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/trigger-scenario",
      action: "validation",
      status: 400,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Missing scenario_id, webhook_url, or payload"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing scenario_id, webhook_url, or payload",
      error: "Missing scenario_id, webhook_url, or payload",
      nextStep: "Provide scenario_id, webhook_url, and payload"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/trigger-scenario",
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
      route: "/api/make/trigger-scenario",
      action: "success",
      status: 200,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      summary: "Scenario triggered"
    }));
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Scenario triggered",
      data
    });
  } catch (error) {
    console.error("Error triggering scenario:", error);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/trigger-scenario",
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
