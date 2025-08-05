import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { postToWebhook } from "../helpers/postToWebhook.js";
import { MEETING_SYNC_WEBHOOK_URL } from "../constants/make.js";

export async function meetingSyncHandler(req, res) {
  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/meeting-sync",
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
      route: "/api/make/meeting-sync",
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

  const { title, datetimeStart, datetimeEnd, description, requester } = req.body || {};

  if (!title || !datetimeStart || !datetimeEnd || !description) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/meeting-sync",
      action: "validation",
      status: 400,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Missing title, datetimeStart, datetimeEnd, or description"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing title, datetimeStart, datetimeEnd, or description",
      error: "Missing title, datetimeStart, datetimeEnd, or description",
      nextStep: "Provide title, datetimeStart, datetimeEnd, and description"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/meeting-sync",
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

  const webhookUrl = process.env.MEETING_SYNC_WEBHOOK_URL || MEETING_SYNC_WEBHOOK_URL;
  const payload = { title, datetimeStart, datetimeEnd, description };

  try {
    const data = await postToWebhook(webhookUrl, payload);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/meeting-sync",
      action: "success",
      status: 200,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      summary: "Meeting synced"
    }));
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Meeting synced",
      data
    });
  } catch (error) {
    console.error("Error syncing meeting:", error);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/meeting-sync",
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

