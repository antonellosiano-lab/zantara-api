import { withSecurity } from "../../helpers/security.js";
import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";

async function handler(req, res) {
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

  const { message } = req.body || {};
  if (!message) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "messageValidation",
        status: 400,
        userIP,
        message: "Missing message in request body"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing message in request body",
      error: "Missing message in request body",
      nextStep: "Include message in JSON body"
    });
  }

  try {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "sendMessage",
        status: 200,
        userIP,
        summary: "Message accepted"
      })
    );
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Message accepted",
      data: { message }
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

export default withSecurity(handler);

