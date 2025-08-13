import { validateOpenAIKey } from "../../../../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../../../../helpers/checkBlockedRequester.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const challenge = req.query["hub.challenge"];
    if (challenge) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route: "/pages/api/webhooks/meta/whatsapp",
          action: "challenge",
          status: 200,
          userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress
        })
      );
      return res.status(200).send(challenge);
    }
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/pages/api/webhooks/meta/whatsapp",
        action: "challenge",
        status: 400,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Missing challenge"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing challenge",
      error: "Missing challenge"
    });
  }

  if (req.method !== "POST") {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/pages/api/webhooks/meta/whatsapp",
        action: "methodCheck",
        status: 405,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Method Not Allowed"
      })
    );
    return res.status(405).json({
      success: false,
      status: 405,
      summary: "Method Not Allowed",
      error: "Method Not Allowed",
      nextStep: "Use POST"
    });
  }

  try {
    validateOpenAIKey();
  } catch (err) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/pages/api/webhooks/meta/whatsapp",
        action: "keyValidation",
        status: 500,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
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

  if (req.headers["content-type"] !== "application/json") {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/pages/api/webhooks/meta/whatsapp",
        action: "contentType",
        status: 400,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Invalid Content-Type"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Invalid content type",
      error: "Content-Type must be application/json",
      nextStep: "Set Content-Type to application/json"
    });
  }

  const { requester } = req.body || {};
  if (!requester) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/pages/api/webhooks/meta/whatsapp",
        action: "payloadValidation",
        status: 400,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Missing requester"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Invalid payload",
      error: "Missing requester",
      nextStep: "Include requester in body"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/pages/api/webhooks/meta/whatsapp",
        action: "blockedRequester",
        status: 403,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
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

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/pages/api/webhooks/meta/whatsapp",
      action: "success",
      status: 200,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      summary: "Request accepted"
    })
  );

  return res.status(200).json({
    success: true,
    status: 200,
    summary: "Request accepted"
  });
}
