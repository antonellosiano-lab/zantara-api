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
        action: "bodyValidation",
        status: 400,
        userIP,
        message: "Missing required fields"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing required fields",
      error: "Missing required fields",
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

  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    const msg = "Missing Meta WhatsApp credentials";
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "configCheck",
        status: 500,
        userIP,
        message: msg
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: msg,
      error: msg,
      nextStep: "Set META_WHATSAPP_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID"
    });
  }

  try {
    const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
    const metaRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message }
      })
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route,
          action: "metaCall",
          status: metaRes.status || 500,
          userIP,
          message: "Meta API error"
        })
      );
      return res.status(500).json({
        success: false,
        status: 500,
        summary: "Meta API error",
        error: metaData.error?.message || "Meta API error"
      });
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "metaCall",
        status: 200,
        userIP,
        summary: "Message sent"
      })
    );

    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Message sent",
      data: metaData
    });
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "error",
        status: 500,
        userIP,
        message: error.message
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

