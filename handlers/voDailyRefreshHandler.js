import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { postToWebhook } from "../helpers/postToWebhook.js";
import { buildVoDailyRefreshPayload } from "../constants/notion.js";

export async function voDailyRefreshHandler(req, res) {
  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/vo-daily-refresh",
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
      route: "/api/make/vo-daily-refresh",
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

  const { webhook_url, log_url, requester } = req.body || {};

  if (!webhook_url || !log_url) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/vo-daily-refresh",
      action: "validation",
      status: 400,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Missing webhook_url or log_url"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing webhook_url or log_url",
      error: "Missing webhook_url or log_url",
      nextStep: "Provide webhook_url and log_url"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/vo-daily-refresh",
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

  const databaseId = process.env.VO_DATABASE_ID || "";
  const notionPayload = buildVoDailyRefreshPayload(databaseId);
  const payload = { route: "VO-DAILY-REFRESH", notion: notionPayload };

  try {
    const data = await postToWebhook(webhook_url, payload);
    await postToWebhook(log_url, { route: "ZION • Logs", result: data });
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/vo-daily-refresh",
      action: "success",
      status: 200,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      summary: "Query dispatched"
    }));
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Query dispatched",
      data
    });
  } catch (error) {
    console.error("Error dispatching query:", error);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/vo-daily-refresh",
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
