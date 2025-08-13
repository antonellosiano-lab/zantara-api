import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";

export async function triggerHandler(req, res) {
  const route = "/api/trigger";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  if (req.method !== "POST") {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "methodCheck",
        status: 405,
        userIP,
        message: "Method Not Allowed"
      })
    );
    return res.status(405).json({
      success: false,
      status: 405,
      summary: "Method Not Allowed",
      error: "Method Not Allowed",
      nextStep: "Send a POST request"
    });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.ZANTARA_SECRET_KEY}`) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "authCheck",
        status: 403,
        userIP,
        message: "Invalid or missing Authorization header"
      })
    );
    return res.status(403).json({
      success: false,
      status: 403,
      summary: "Invalid or missing Authorization header",
      error: "Access denied"
    });
  }

  try {
    validateOpenAIKey();
  } catch (err) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "keyValidation",
        status: 500,
        userIP,
        message: err.message
      })
    );
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
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "promptValidation",
        status: 400,
        userIP,
        message: "Missing prompt in request body"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing prompt in request body",
      error: "Missing prompt in request body",
      nextStep: "Include prompt in JSON body"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "blockedRequester",
        status: 403,
        userIP,
        message: "Requester is blocked"
      })
    );
    return res.status(403).json({
      success: false,
      status: 403,
      summary: "Requester is blocked",
      error: "Access denied"
    });
  }

  try {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "trigger",
        status: 200,
        userIP,
        summary: "Trigger accepted"
      })
    );
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Trigger accepted",
      data: { message: "Trigger processed" }
    });
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "error",
        status: 500,
        userIP,
        message: "Internal Server Error"
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Internal Server Error",
      error: "Internal Server Error",
      nextStep: "Check server logs and retry"
    });
  }
}

