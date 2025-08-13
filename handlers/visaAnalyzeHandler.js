import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { visaUpdates } from "../constants/visaUpdates.js";

export async function visaAnalyzeHandler(req, res) {
  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/visa/analyze",
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
      route: "/visa/analyze",
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

  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/visa/analyze",
      action: "apiKeyValidation",
      status: 401,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Missing API Key"
    }));
    return res.status(401).json({
      success: false,
      status: 401,
      summary: "Missing API Key",
      error: "Missing API Key",
      nextStep: "Include X-API-Key header"
    });
  }

  const { nationality, visa_type, requester } = req.body || {};

  if (!nationality) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/visa/analyze",
      action: "nationalityValidation",
      status: 400,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Missing nationality in request body"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing nationality in request body",
      error: "Missing nationality in request body",
      nextStep: "Include nationality in JSON body"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/visa/analyze",
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

  const updates = visaUpdates[visa_type];

  if (!updates) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/visa/analyze",
      action: "noUpdates",
      status: 200,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "No updates found"
    }));
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "No updates found",
      data: { updates: [], stale: true }
    });
  }

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    route: "/visa/analyze",
    action: "success",
    status: 200,
    userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
    summary: "Updates found"
  }));

  return res.status(200).json({
    success: true,
    status: 200,
    summary: "Updates found",
    data: { updates }
  });
}
