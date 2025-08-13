import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { postToZion } from "../helpers/postToZion.js";
import { VO_DAILY_REFRESH_PAYLOAD } from "../constants/vo.js";
import { DEFAULT_ZION_URL, DEFAULT_ZION_LOGS_URL } from "../constants/zion.js";

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

  const { requester } = req.body || {};
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

  const zionUrl = process.env.ZION_URL || DEFAULT_ZION_URL;
  const zionLogsUrl = process.env.ZION_LOGS_URL || DEFAULT_ZION_LOGS_URL;

  try {
    const data = await postToZion(zionUrl, VO_DAILY_REFRESH_PAYLOAD);
    await postToZion(zionLogsUrl, { route: "VO-DAILY-REFRESH", data });
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/make/vo-daily-refresh",
      action: "success",
      status: 200,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      summary: "ZION query executed"
    }));
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "ZION query executed",
      data
    });
  } catch (error) {
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
