import { Client } from "@notionhq/client";
import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  const route = "/api/notion-write";
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

  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${process.env.ZANTARA_API_KEY}`) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "authCheck",
        status: 401,
        userIP,
        message: "Unauthorized"
      })
    );
    return res.status(401).json({
      success: false,
      status: 401,
      summary: "Unauthorized",
      error: "Unauthorized",
      nextStep: "Provide a valid Authorization header"
    });
  }

  const { request, summary } = req.body || {};
  if (!request || !summary) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "validation",
        status: 400,
        userIP,
        message: "Missing request or summary"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing request or summary",
      error: "Missing request or summary",
      nextStep: "Include request and summary"
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

  try {
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        Request: {
          title: [{ text: { content: request } }]
        },
        "Response Summary": {
          rich_text: [{ text: { content: summary } }]
        }
      }
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "success",
        status: 200,
        userIP,
        summary: "Request saved to Notion"
      })
    );

    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Request saved to Notion",
      data: response
    });
  } catch (error) {
    console.error("Notion error:", error);
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

