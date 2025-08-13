import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../../helpers/checkBlockedRequester.js";
const processedEvents = new Set();

export default async function handler(req, res) {
  const route = "/api/whatsapp/webhook";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
  const VERIFY_TOKEN = process.env.ZANTARA_WHATSAPP_TOKEN || "ZANTARA_WHATSAPP_TOKEN";

  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route,
          action: "verify",
          status: 200,
          userIP,
        })
      );
      res.setHeader("Content-Type", "text/plain");
      return res.status(200).send(challenge);
    }

    if (mode === "subscribe" && token === VERIFY_TOKEN && !challenge) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route,
          action: "verify",
          status: 400,
          userIP,
          message: "Missing challenge",
        })
      );
      return res.status(400).json({
        success: false,
        status: 400,
        summary: "Missing challenge",
        error: "Missing challenge",
      });
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "verify",
        status: 403,
        userIP,
        message: "Invalid token",
      })
    );
    return res.sendStatus(403);
  }

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
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({
      success: false,
      status: 405,
      summary: "Method Not Allowed",
      error: "Method Not Allowed",
      nextStep: "Use POST",
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

  try {
    const { requester, entry } = req.body || {};

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

    const ids = [];
    if (Array.isArray(entry)) {
      for (const ent of entry) {
        const changes = ent?.changes || [];
        for (const change of changes) {
          const messages = change?.value?.messages || [];
          for (const msg of messages) {
            if (msg.id) ids.push(msg.id);
          }
        }
      }
    }

    let summary;
    let newCount = 0;
    for (const id of ids) {
      if (!processedEvents.has(id)) {
        processedEvents.add(id);
        newCount++;
      }
    }

    if (!ids.length) {
      summary = "No messages";
    } else if (newCount) {
      summary = "Event processed";
    } else {
      summary = "Event already processed";
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "process",
        status: 200,
        userIP,
        summary,
      })
    );

    return res.status(200).json({ success: true, status: 200, summary });
  } catch (err) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "process",
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
    });
  }
}
