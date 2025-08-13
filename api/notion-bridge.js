import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { sendNotionUpdate } from "../helpers/notionBridge.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/notion-bridge",
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
      route: "/api/notion-bridge",
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

  const { request, summary, requester } = req.body || {};
  if (!request || !summary || !requester) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/notion-bridge",
      action: "bodyValidation",
      status: 400,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Missing required fields: request, summary, requester"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing required fields: request, summary, requester",
      error: "Missing required fields",
      nextStep: "Include request, summary, and requester in JSON body"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/notion-bridge",
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
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/notion-bridge",
      action: "forwardToNotion",
      status: 200,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Sending to Notion"
    }));
    const result = await sendNotionUpdate({ request, summary });

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/notion-bridge",
      action: result.success ? "success" : "error",
      status: result.status,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      summary: result.summary
    }));

    return res.status(result.status).json(result);
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/notion-bridge",
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
