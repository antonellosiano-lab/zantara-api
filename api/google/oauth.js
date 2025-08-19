import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../../helpers/checkBlockedRequester.js";
import { saveTokens } from "../../helpers/googleTokens.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/oauth",
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
        route: "/api/google/oauth",
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

  const { code, redirect_uri, requester } = req.body || {};

  if (!code || !redirect_uri) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/oauth",
        action: "bodyValidation",
        status: 400,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Missing code or redirect_uri"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing code or redirect_uri",
      error: "Missing code or redirect_uri",
      nextStep: "Include code and redirect_uri"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/oauth",
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
    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri,
      grant_type: "authorization_code"
    });
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "OAuth exchange failed");
    }
    await saveTokens(data);
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/oauth",
        action: "exchange",
        status: 200,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        success: true
      })
    );
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Tokens saved",
      data: { access_token: data.access_token },
      nextStep: "Use token for Google API requests"
    });
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/oauth",
        action: "exchange",
        status: 500,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: error.message
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "OAuth exchange failed",
      error: "OAuth exchange failed",
      nextStep: "Verify OAuth code and credentials"
    });
  }
}
