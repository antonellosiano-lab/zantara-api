import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { enqueueCanvaJob } from "../helpers/jobQueue.js";

export async function canvaGenerateHandler(req, res) {
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

  const { prompt, requester } = req.body || {};

  if (!prompt) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/canva/generate",
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
    const jobId = enqueueCanvaJob({ prompt });
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/canva/generate",
      action: "enqueue",
      status: 202,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      summary: "Job enqueued"
    }));
    return res.status(202).json({
      success: true,
      status: 202,
      summary: "Job enqueued",
      data: { jobId }
    });
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/canva/generate",
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
