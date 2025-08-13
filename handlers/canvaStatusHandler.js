import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { getCanvaJob } from "../helpers/jobQueue.js";

export async function canvaStatusHandler(req, res) {
  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/canva/status",
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
      route: "/api/canva/status",
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

  const { jobId } = req.body || {};

  if (!jobId) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/canva/status",
      action: "jobIdValidation",
      status: 400,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Missing jobId in request body"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing jobId in request body",
      error: "Missing jobId in request body",
      nextStep: "Include jobId in JSON body"
    });
  }

  const job = getCanvaJob(jobId);

  if (!job) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/canva/status",
      action: "jobNotFound",
      status: 404,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Job not found"
    }));
    return res.status(404).json({
      success: false,
      status: 404,
      summary: "Job not found",
      error: "Job not found"
    });
  }

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    route: "/api/canva/status",
    action: "statusCheck",
    status: 200,
    userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
    summary: "Job status retrieved"
  }));
  return res.status(200).json({
    success: true,
    status: 200,
    summary: "Job status retrieved",
    data: job
  });
}
