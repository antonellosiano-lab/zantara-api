import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";

export default async function handler(req, res) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/notion/test",
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

    const NOTION_API_KEY = process.env.NOTION_API_KEY;
    const DATABASE_ID = process.env.NOTION_DATABASE_ID;

    if (!NOTION_API_KEY || !DATABASE_ID) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route: "/api/notion/test",
          action: "missing_env",
          error: "Missing Notion API credentials",
        })
      );
      return res.status(500).json({
        success: false,
        status: 500,
        summary: "Missing Notion API credentials",
        error: "Missing Notion API credentials in environment",
      });
    }

    const pageData = {
      parent: {
        database_id: DATABASE_ID,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: "Test ZANTARA",
              },
            },
          ],
        },
        Status: {
          select: {
            name: "Draft",
          },
        },
      },
    };

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(pageData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route: "/api/notion/test",
          action: "notion_error",
          error: data,
        })
      );
      return res.status(response.status).json({
        success: false,
        status: response.status,
        summary: "Failed to create page in Notion",
        error: data,
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Page created successfully in Notion",
      data,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion/test",
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
