import { Client } from "@notionhq/client";
import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";
import { findPageByRichText } from "../helpers/findPageByRichText.js";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  const route = "/api/zion";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  if (req.method !== "POST") {
    console.log("ZION • Logs", JSON.stringify({
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

  if (!req.headers["x-zion-key"]) {
    console.log("ZION • Logs", JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "auth",
      status: 401,
      userIP,
      message: "Missing x-zion-key header"
    }));
    return res.status(401).json({
      success: false,
      status: 401,
      summary: "Missing x-zion-key header",
      error: "Missing x-zion-key header",
      nextStep: "Include x-zion-key header"
    });
  }

  try {
    validateOpenAIKey();
  } catch (err) {
    console.log("ZION • Logs", JSON.stringify({
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

  const { envelope, requester } = req.body || {};

  if (isBlockedRequester(requester)) {
    console.log("ZION • Logs", JSON.stringify({
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

  if (!envelope || typeof envelope !== "object") {
    console.log("ZION • Logs", JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "payloadValidation",
      status: 400,
      userIP,
      message: "Missing envelope in request body"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing envelope in request body",
      error: "Missing envelope in request body",
      nextStep: "Include envelope in JSON body"
    });
  }

  try {
    if (envelope.action === "notion.create_page") {
      const eventId = envelope.properties?.["Event ID"]?.rich_text?.[0]?.plain_text ||
        envelope.properties?.["Event ID"]?.rich_text?.[0]?.text?.content;
      if (eventId) {
        const existing = await findPageByRichText(envelope.database_id, "Event ID", eventId);
        if (existing) {
          envelope.action = "notion.update_page";
          envelope.page_id = existing.id;
        }
      }
    }

    let data;
    switch (envelope.action) {
      case "notion.create_page":
        data = await notion.pages.create({
          parent: { database_id: envelope.database_id },
          properties: envelope.properties
        });
        break;
      case "notion.update_page":
        data = await notion.pages.update({
          page_id: envelope.page_id,
          properties: envelope.properties
        });
        break;
      default:
        console.log("ZION • Logs", JSON.stringify({
          timestamp: new Date().toISOString(),
          route,
          action: "unsupportedAction",
          status: 400,
          userIP,
          message: "Unsupported action"
        }));
        return res.status(400).json({
          success: false,
          status: 400,
          summary: "Unsupported action",
          error: "Unsupported action"
        });
    }

    console.log("ZION • Logs", JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: envelope.action,
      status: 200,
      userIP,
      summary: "Request completed successfully"
    }));

    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Request completed successfully",
      data
    });
  } catch (error) {
    console.log("ZION • Logs", JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "error",
      status: 500,
      userIP,
      message: error.message
    }));
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Internal Server Error",
      error: error.message,
      nextStep: "Check server logs and retry"
    });
  }
}
