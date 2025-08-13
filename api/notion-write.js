import { Client } from "@notionhq/client";
import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion-write",
        action: "methodNotAllowed",
        status: 405,
        userIP: req.headers["x-forwarded-for"]
      })
    );
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.ZANTARA_API_KEY}`) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion-write",
        action: "unauthorized",
        status: 401,
        userIP: req.headers["x-forwarded-for"]
      })
    );
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { request, summary, tags, date } = req.body || {};
  if (!request || !summary) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion-write",
        action: "badRequest",
        status: 400,
        userIP: req.headers["x-forwarded-for"]
      })
    );
    return res
      .status(400)
      .json({ success: false, error: "Missing request or summary" });
  }

  try {
    validateOpenAIKey();

    const properties = {
      Request: {
        title: [{ text: { content: request } }]
      },
      "Response Summary": {
        rich_text: [{ text: { content: summary } }]
      }
    };

    if (Array.isArray(tags) && tags.length > 0) {
      properties.Tags = {
        multi_select: tags.map((name) => ({ name }))
      };
    }

    const dateValue = typeof date === "string" ? date : new Date().toISOString();
    properties.Date = { date: { start: dateValue } };

    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion-write",
        action: "created",
        status: 200,
        userIP: req.headers["x-forwarded-for"]
      })
    );

    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion-write",
        action: "error",
        status: 500,
        message: error.message,
        userIP: req.headers["x-forwarded-for"]
      })
    );
    return res.status(500).json({ success: false, error: error.message });
  }
}
