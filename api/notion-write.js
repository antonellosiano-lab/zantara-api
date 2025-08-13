import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { request, summary } = req.body;

  try {
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

    return res.status(200).json({ message: "Success", data: response });
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion-write",
        action: "error",
        status: 500,
        message: error.message
      })
    );
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
