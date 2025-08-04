/* Send email through Gmail */
import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../../helpers/checkBlockedRequester.js";
import { sendEmail } from "../../helpers/sendEmail.js";

export default async function handler(req, res) {
  const route = "/api/zion/email";
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

  const { ACTION, TO, TEXT, requester } = req.body || {};

  if (!ACTION || !TO || !TEXT) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "payloadValidation",
      status: 400,
      userIP,
      message: "Missing ACTION, TO, or TEXT"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing ACTION, TO, or TEXT",
      error: "Missing ACTION, TO, or TEXT",
      nextStep: "Provide ACTION, TO, and TEXT"
    });
  }

  if (isBlockedRequester(requester)) {
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

  try {
    await sendEmail({ action: ACTION, to: TO, text: TEXT });
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: ACTION,
      status: 200,
      userIP,
      summary: "Email sent"
    }));
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Email sent",
      data: { message: "Email dispatched" }
    });
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: ACTION,
      status: 500,
      userIP,
      message: error.message
    }));
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Email send failed",
      error: "Email send failed"
    });
  }
}
