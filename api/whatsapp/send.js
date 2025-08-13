import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../../helpers/checkBlockedRequester.js";

async function sendWithRetry(url, options, retries = 3) {
  let attempt = 0;
  while (attempt < retries) {
    const response = await fetch(url, options);
    if (response.ok) {
      return await response.json();
    }
    attempt++;
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  throw new Error("Failed to send message");
}

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
        message: "Method Not Allowed",
      })
    );
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
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "keyValidation",
        status: 500,
        userIP,
        message: err.message,
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: err.message,
      error: err.message,
      nextStep: "Set OPENAI_API_KEY in environment",
    });
  }

  const {
    requester,
    to,
    type,
    message,
    template,
    mediaUrl,
    mediaType,
    lastInteraction,
  } = req.body || {};

  if (isBlockedRequester(requester)) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "blockedRequester",
        status: 403,
        userIP,
        message: "Requester is blocked",
      })
    );
    return res.status(403).json({
      success: false,
      status: 403,
      summary: "Requester is blocked",
      error: "Access denied",
    });
  }

  if (!to || !type) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "payloadValidation",
        status: 400,
        userIP,
        message: "Missing 'to' or 'type'",
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing 'to' or 'type'",
      error: "Missing 'to' or 'type'",
      nextStep: "Provide 'to' and 'type' in body",
    });
  }

  if (type === "text" && !message) {
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing text message",
      error: "Missing text message",
      nextStep: "Include 'message' for text type",
    });
  }

  if (type === "template" && !template) {
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing template data",
      error: "Missing template data",
      nextStep: "Provide 'template' object",
    });
  }

  if (type === "media" && (!mediaUrl || !mediaType)) {
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing media data",
      error: "Missing media data",
      nextStep: "Provide 'mediaUrl' and 'mediaType'",
    });
  }

  if (type !== "template") {
    const last = new Date(lastInteraction || 0).getTime();
    const diff = Date.now() - last;
    if (!lastInteraction || diff > 72 * 60 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        status: 400,
        summary: "Session expired",
        error: "Session expired",
        nextStep: "Use template message",
      });
    }
  }

  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneId || !token) {
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Missing WhatsApp credentials",
      error: "Missing WhatsApp credentials",
      nextStep: "Set WHATSAPP_PHONE_ID and WHATSAPP_TOKEN",
    });
  }

  let payload;
  if (type === "text") {
    payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    };
  } else if (type === "template") {
    payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template,
    };
  } else if (type === "media") {
    payload = {
      messaging_product: "whatsapp",
      to,
      type: mediaType,
      [mediaType]: { link: mediaUrl },
    };
  }

  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };

  try {
    const data = await sendWithRetry(url, options);
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "send",
        status: 200,
        userIP,
        summary: "Message sent",
      })
    );
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Message sent",
      data,
    });
  } catch (err) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "sendError",
        status: 500,
        userIP,
        message: err.message,
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Failed to send message",
      error: err.message,
      nextStep: "Check WhatsApp API and retry",
    });
  }
}

