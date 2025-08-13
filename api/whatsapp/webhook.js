import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../../helpers/checkBlockedRequester.js";

export default async function handler(req, res) {
  const route = "/api/whatsapp/webhook";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
  const VERIFY_TOKEN = process.env.ZANTARA_WHATSAPP_TOKEN || "ZANTARA_WHATSAPP_TOKEN";

  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route,
          action: "challenge",
          status: 200,
          userIP
        })
      );
      res.setHeader("Content-Type", "text/plain");
      return res.status(200).send(challenge);
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "challenge",
        status: 403,
        userIP,
        message: "Verification failed"
      })
    );
    return res.status(403).json({
      success: false,
      status: 403,
      summary: "Verification failed",
      error: "Verification failed"
    });
  }

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
      nextStep: "Use GET or POST"
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

  const { requester } = req.body || {};

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
        action: "success",
        status: 200,
        userIP,
        summary: "Event received"
      })
    );
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Event received",
      data: req.body || {}
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
