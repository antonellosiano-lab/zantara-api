import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../../helpers/checkBlockedRequester.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/canva/generate",
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
      route: "/api/canva/generate",
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

  if (!process.env.CANVA_API_KEY) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/canva/generate",
      action: "canvaKeyValidation",
      status: 500,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Missing Canva API Key"
    }));
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Missing Canva API Key",
      error: "Missing Canva API Key",
      nextStep: "Set CANVA_API_KEY in environment"
    });
  }

  const { designId, requester } = req.body || {};

  if (!designId) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/canva/generate",
      action: "bodyValidation",
      status: 400,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Missing designId in request body"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing designId in request body",
      error: "Missing designId in request body",
      nextStep: "Include designId in JSON body"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/canva/generate",
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
    const response = await fetch("https://api.canva.com/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CANVA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ designId })
    });

    const data = await response.json().catch(() => ({}));

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/canva/generate",
      action: "queueJob",
      status: response.status,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      jobId: data.jobId
    }));

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        status: response.status,
        summary: "Failed to queue job",
        error: data.error || "Request failed"
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Job queued",
      data: { jobId: data.jobId }
    });
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/canva/generate",
      action: "error",
      status: 500,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: error.message
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

