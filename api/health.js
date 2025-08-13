import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { logEvent, reportError } from "../lib/observability.js";

export default async function handler(req, res) {
  const route = "/api/health";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  if (req.method !== "POST") {
    await logEvent("info", {
      route,
      action: "methodCheck",
      status: 405,
      userIP,
      message: "Method Not Allowed",
    });
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
    await logEvent("error", {
      route,
      action: "keyValidation",
      status: 500,
      userIP,
      message: err.message,
    });
    reportError(err);
    return res.status(500).json({
      success: false,
      status: 500,
      summary: err.message,
      error: err.message,
      nextStep: "Set OPENAI_API_KEY in environment",
    });
  }

  try {
    await logEvent("info", {
      route,
      action: "healthCheck",
      status: 200,
      userIP,
      summary: "ok",
    });
    return res.status(200).json({ success: true, status: 200, summary: "ok" });
  } catch (error) {
    reportError(error);
    await logEvent("error", {
      route,
      action: "error",
      status: 500,
      userIP,
      message: "Internal Server Error",
    });
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Internal Server Error",
      error: "Internal Server Error",
      nextStep: "Check server logs and retry",
    });
  }
}
