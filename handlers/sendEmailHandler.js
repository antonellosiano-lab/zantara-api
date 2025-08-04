import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { sendEmail } from "../helpers/sendEmail.js";

export async function sendEmailHandler(req, res) {
  const route = "/api/zion/email";

  if (req.method !== "POST") {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
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

  const { to, subject, text, requester } = req.body || {};

  if (!to || !subject || !text) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "validation",
        status: 400,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Missing to, subject, or text"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing to, subject, or text",
      error: "Missing to, subject, or text",
      nextStep: "Provide to, subject, and text"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
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

  try {
    await sendEmail(to, subject, text);
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "success",
        status: 200,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        summary: "Email sent"
      })
    );
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Email sent",
      data: { to }
    });
  } catch (error) {
    console.error("Error sending email:", error);
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "error",
        status: 500,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
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
