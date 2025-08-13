import { Client } from "@notionhq/client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ success: false, error: "Missing OpenAI API Key" });
  }

  const notionToken = process.env.NOTION_TOKEN;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !notionDatabaseId) {
    return res.status(500).json({ success: false, error: "Missing Notion configuration" });
  }

  const { request, summary } = req.body || {};

  if (!request) {
    return res.status(400).json({ success: false, error: "Missing request field" });
  }

  try {
    const notion = new Client({ auth: notionToken });

    const response = await notion.pages.create({
      parent: { database_id: notionDatabaseId },
      properties: {
        Request: {
          title: [{ text: { content: request } }],
        },
        "Response Summary": {
          rich_text: [{ text: { content: summary || "N/A" } }],
        },
      },
    });

    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion-write",
        action: "notionDatabaseCreate",
        status: 500,
        message: error.message,
      })
    );
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
