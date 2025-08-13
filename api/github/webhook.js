import crypto from "crypto";
import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../../helpers/checkBlockedRequester.js";
import { githubApiRequest } from "../../helpers/githubApi.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/github/webhook",
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
        route: "/api/github/webhook",
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

  const rawBody = JSON.stringify(req.body || {});
  if (!rawBody || rawBody === "{}") {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/github/webhook",
        action: "bodyValidation",
        status: 400,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Empty body"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Empty body",
      error: "Empty body",
      nextStep: "Provide JSON payload"
    });
  }

  const signature = req.headers["x-hub-signature-256"] || "";
  const secret = process.env.GITHUB_WEBHOOK_SECRET || "";
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  let valid = false;
  if (signature) {
    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expected);
    if (sigBuffer.length === expBuffer.length) {
      valid = crypto.timingSafeEqual(sigBuffer, expBuffer);
    }
  }
  if (!valid) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/github/webhook",
        action: "signatureCheck",
        status: 401,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Invalid signature"
      })
    );
    return res.status(401).json({
      success: false,
      status: 401,
      summary: "Invalid signature",
      error: "Invalid signature",
      nextStep: "Provide a valid signature"
    });
  }

  const requester = req.body?.sender?.login || req.body?.pusher?.name;
  if (requester && isBlockedRequester(requester)) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/github/webhook",
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

  const event = req.headers["x-github-event"];

  try {
    switch (event) {
      case "push": {
        await githubApiRequest("/rate_limit");
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            route: "/api/github/webhook",
            action: "pushEvent",
            status: 200,
            userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
            message: "Push event processed"
          })
        );
        return res.status(200).json({
          success: true,
          status: 200,
          summary: "Push event processed"
        });
      }
      default: {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            route: "/api/github/webhook",
            action: "unhandledEvent",
            status: 200,
            userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
            message: `Unhandled event ${event}`
          })
        );
        return res.status(200).json({
          success: true,
          status: 200,
          summary: `Unhandled event ${event}`
        });
      }
    }
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/github/webhook",
        action: "error",
        status: 500,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
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
