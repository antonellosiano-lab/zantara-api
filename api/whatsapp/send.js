import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../../helpers/checkBlockedRequester.js";

export default async function handler(req, res) {
  const route = "/api/whatsapp/send";
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

  const { to, message, requester } = req.body || {};

  if (!to || !message) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "payloadValidation",
        status: 400,
        userIP,
        message: "Missing to or message in request body"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing to or message in request body",
      error: "Missing to or message in request body",
      nextStep: "Include to and message in JSON body"
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

  const token = process.env.WHATSAPP_TOKEN;
  if (!token) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "tokenValidation",
        status: 500,
        userIP,
        message: "Missing WhatsApp token"
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Missing WhatsApp token",
      error: "Missing WhatsApp token",
      nextStep: "Set WHATSAPP_TOKEN in environment"
    });
  }

  const phoneId = process.env.WHATSAPP_PHONE_ID || "";
  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        text: { body: message }
      })
    });

    const data = await response.json();

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "sendMessage",
        status: 200,
        userIP,
        summary: "Message sent"
      })
    );

    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Message sent",
      data
    });
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "sendMessage",
        status: 500,
        userIP,
        message: "Failed to send message"
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Failed to send message",
      error: "Failed to send message",
      nextStep: "Check server logs and retry"
    });
  }
}

