import { initObservability } from "../lib/observability.js";
initObservability();

import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";

export default async function handler(req, res) {
  const route = "/api/health";
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

    if (!process.env.SENTRY_DSN || !process.env.LOGTAIL_SOURCE_TOKEN) {
      throw new Error("Missing observability configuration");
    }

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "healthCheck",
      status: 200,
      userIP,
      summary: "OK"
    }));

    return res.status(200).json({
      success: true,
      status: 200,
      summary: "OK"
    });
  } catch (err) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "healthCheck",
      status: 500,
      userIP,
      message: err.message
    }));
    return res.status(500).json({
      success: false,
      status: 500,
      summary: err.message,
      error: err.message,
      nextStep: "Check server configuration"
    });
  }
}
