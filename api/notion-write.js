import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion-write",
        action: "missingOpenAIKey",
      })
    );
    return res.status(500).json({ success: false, error: "Missing OpenAI API Key" });
  }

  const { request, summary, tags, date } = req.body || {};

  if (!request || typeof request !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "Missing or invalid request" });
  }

  if (summary !== undefined && typeof summary !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "Invalid summary" });
  }

  if (
    tags !== undefined &&
    !(
      typeof tags === "string" ||
      (Array.isArray(tags) && tags.every((t) => typeof t === "string"))
    )
  ) {
    return res.status(400).json({ success: false, error: "Invalid tags" });
  }

  if (date !== undefined) {
    const parsed = new Date(date);
    if (typeof date !== "string" || isNaN(parsed)) {
      return res.status(400).json({ success: false, error: "Invalid date" });
    }
  }

  const tagArray = tags
    ? Array.isArray(tags)
      ? tags
      : [tags]
    : [];
  const isoDate = date ? new Date(date).toISOString() : new Date().toISOString();

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
        Date: {
          date: { start: isoDate },
        },
        Tags: {
          multi_select: tagArray.map((name) => ({ name })),
        },
      },
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion-write",
        action: "pageCreated",
        status: 200,
      })
    );

    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion-write",
        action: "notionError",
        error: error.message,
      })
    );
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
}
