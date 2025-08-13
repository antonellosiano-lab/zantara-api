import { Client } from "@notionhq/client";
import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/notion-write",
      method: req.method,
    })
  );

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      status: 405,
      summary: "Method Not Allowed",
      error: "Only POST requests are allowed",
    });
  }

  try {
    validateOpenAIKey();

    const { request, summary } = req.body || {};
    if (!request) {
      return res.status(400).json({
        success: false,
        status: 400,
        summary: "Missing request field",
        error: "The request field is required",
      });
    }

    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        Request: {
          title: [{ text: { content: request } }],
        },
        "Response Summary": {
          rich_text: [{ text: { content: summary || "N/A" } }],
        },
      },
    });

    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Success",
      data: response,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion-write",
        action: "exception",
        error: error.message,
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Internal Server Error",
      error: error.message,
    });
  }
}
