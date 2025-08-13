import { Client } from "@notionhq/client";
import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";

const log = (e) => console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  route: e.route,
  action: e.action,
  status: e.status,
  message: e.message,
  userIP: e.userIP,
  meta: e.meta || null
}));

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default async function handler(req, res) {
  const route = "/api/notion-write";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  if (req.method !== "POST") {
    log({ route, action: "methodCheck", status: 405, message: "Method Not Allowed", userIP });
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
    log({ route, action: "keyValidation", status: 500, message: err.message, userIP });
    return res.status(500).json({
      success: false,
      status: 500,
      summary: err.message,
      error: err.message,
      nextStep: "Set OPENAI_API_KEY in environment"
    });
  }

  const { request, summary } = req.body || {};

  try {
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        Request: {
          title: [{ text: { content: request } }]
        },
        "Response Summary": {
          rich_text: [{ text: { content: summary || "N/A" } }]
        }
      }
    });

    log({ route, action: "success", status: 200, message: "Entry created", userIP });
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Entry created",
      data: response
    });
  } catch (error) {
    log({ route, action: "error", status: 500, message: "Internal Server Error", userIP, meta: error.message });
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Internal Server Error",
      error: "Internal Server Error",
      nextStep: "Check server logs and retry"
    });
  }
}
