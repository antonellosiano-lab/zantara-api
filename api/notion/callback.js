import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";

export default async function handler(req, res) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/notion/callback",
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

    const { code } = req.body || {};
    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        status: 400,
        summary: "Missing or invalid code",
        error: "The request must include a valid `code` string.",
      });
    }

    const notionToken = process.env.NOTION_TOKEN;
    const notionDatabaseId = process.env.NOTION_DATABASE_ID;

    if (!notionToken || !notionDatabaseId) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route: "/api/notion/callback",
          action: "missing_env",
          error: "Missing NOTION_TOKEN or NOTION_DATABASE_ID",
        })
      );
      return res.status(500).json({
        success: false,
        status: 500,
        summary: "Missing environment variables",
        error: "Missing environment variables",
      });
    }

    // Optional: transform the code into Notion content
    const newEntry = {
      parent: { database_id: notionDatabaseId },
      properties: {
        Title: {
          title: [{ text: { content: `Request: ${code}` } }],
        },
      },
    };

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(newEntry),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route: "/api/notion/callback",
          action: "notion_error",
          error: data,
        })
      );
      return res.status(response.status).json({
        success: false,
        status: response.status,
        summary: "Failed to save to Notion",
        error: data,
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Entry saved to Notion",
      data: { notionPageId: data.id },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion/callback",
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
