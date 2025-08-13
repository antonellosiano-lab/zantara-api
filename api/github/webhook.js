import { createHmac, timingSafeEqual } from "node:crypto";
import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../../helpers/checkBlockedRequester.js";

/**
 * GitHub webhook handler verifying signatures and respecting Zantara API rules
 */
export default async function handler(req, res) {
  const route = "/api/github/webhook";
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

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "secretCheck",
        status: 500,
        userIP,
        message: "Missing GitHub Webhook Secret"
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Missing GitHub Webhook Secret",
      error: "Missing GitHub Webhook Secret",
      nextStep: "Set GITHUB_WEBHOOK_SECRET in environment"
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

  const signature = req.headers["x-hub-signature-256"];
  if (!signature) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "signatureMissing",
        status: 400,
        userIP,
        message: "Missing signature"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing signature",
      error: "Missing signature",
      nextStep: "Include X-Hub-Signature-256 header"
    });
  }

  const payload = JSON.stringify(req.body || {});
  const hmac = createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  const signatureBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);
  const isValid =
    signatureBuffer.length === digestBuffer.length &&
    timingSafeEqual(signatureBuffer, digestBuffer);

  if (!isValid) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "signatureVerify",
        status: 401,
        userIP,
        message: "Invalid signature"
      })
    );
    return res.status(401).json({
      success: false,
      status: 401,
      summary: "Invalid signature",
      error: "Invalid signature"
    });
  }

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "success",
      status: 200,
      userIP,
      summary: "Webhook received"
    })
  );

  return res.status(200).json({
    success: true,
    status: 200,
    summary: "Webhook received",
    data: { event: req.headers["x-github-event"] }
  });
}

