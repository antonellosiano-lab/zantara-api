import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";

// Forward Notion page creation requests to ZION
export default async function handler(req, res) {
  const route = "/api/notion-write";
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
  } catch (err) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "keyValidation",
      status: 500,
      userIP,
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

  const pageData = req.body;
  if (!pageData || Object.keys(pageData).length === 0) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "payloadValidation",
      status: 400,
      userIP,
      message: "Missing page data"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing page data",
      error: "Missing page data",
      nextStep: "Include page data in JSON body"
    });
  }

  if (isBlockedRequester(pageData.requester)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "blockedRequester",
      status: 403,
      userIP,
      message: "Requester is blocked"
    }));
    return res.status(403).json({
      success: false,
      status: 403,
      summary: "Requester is blocked",
      error: "Access denied"
    });
  }

  const zionKey = process.env.ZION_KEY;
  if (!zionKey) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "zionKeyValidation",
      status: 500,
      userIP,
      message: "Missing ZION_KEY"
    }));
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Missing ZION_KEY",
      error: "Missing ZION_KEY",
      nextStep: "Set ZION_KEY in environment"
    });
  }

  try {
    const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
    const response = await fetch(`${baseUrl}/api/zion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zion-key": zionKey
      },
      body: JSON.stringify(pageData)
    });

    const data = await response.json();
    if (!response.ok) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "zionRequest",
        status: response.status,
        userIP,
        message: data.error || "ZION request failed"
      }));
      return res.status(response.status).json({
        success: false,
        status: response.status,
        summary: data.error || "ZION request failed",
        error: data.error || "ZION request failed",
        nextStep: "Check ZION service"
      });
    }

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "zionRequest",
      status: 200,
      userIP,
      summary: "Page created via ZION"
    }));
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Page created via ZION",
      data
    });
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "error",
      status: 500,
      userIP,
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

