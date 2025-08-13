import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  const route = "/api/notion-write";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "methodCheck",
      status: 405,
      userIP,
      message: "Method Not Allowed",
    }));
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

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "success",
      status: 200,
      userIP,
      message: "Notion entry created",
    }));

    return res.status(200).json({ message: "Success", data: response });
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "error",
      status: 500,
      userIP,
      message: `Notion error: ${error.message}`,
    }));
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
