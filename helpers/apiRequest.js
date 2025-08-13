import { validateOpenAIKey } from "./validateOpenAIKey.js";
import { isBlockedRequester } from "./checkBlockedRequester.js";

/**
 * Generic API request handler.
 * Expects JSON body with { url, payload?, requester? }.
 */
export async function apiRequest(req, res) {
  const route = "/api/request";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "methodCheck",
      status: 405,
      userIP,
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
      route,
      action: "keyValidation",
      status: 500,
      userIP,
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

  const { url, payload, requester } = req.body || {};

  if (!url) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "validation",
      status: 400,
      userIP,
      message: "Missing url in request body"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing url in request body",
      error: "Missing url in request body",
      nextStep: "Include url in JSON body"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "blockedRequester",
      status: 403,
      userIP,
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
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    });
    const data = await response.json();

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "success",
      status: 200,
      userIP,
      summary: "Request completed successfully"
    }));

    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Request completed successfully",
      data
    });
  } catch (error) {
    console.error("Error performing API request:", error);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "error",
      status: 500,
      userIP,
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
