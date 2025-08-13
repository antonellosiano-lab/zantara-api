import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { analyzeSchema } from "../helpers/analyzeSchema.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/analyze",
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
      route: "/api/analyze",
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

  const body = req.body || {};
  const { requester } = body;

  if (isBlockedRequester(requester)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/analyze",
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

  const valid = analyzeSchema(body);

  if (!valid) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/analyze",
      action: "schemaValidation",
      status: 400,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Invalid request body"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Invalid request body",
      error: "Invalid request body",
      nextStep: "Check request JSON"
    });
  }

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    route: "/api/analyze",
    action: "success",
    status: 200,
    userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
    summary: "Request validated"
  }));

  return res.status(200).json({
    success: true,
    status: 200,
    summary: "Request validated",
    data: body
  });
}
