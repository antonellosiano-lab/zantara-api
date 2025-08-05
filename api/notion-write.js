// /pages/api/notion-write.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const { request, summary } = req.body;

  try {
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID! },
      properties: {
        Request: {
          title: [
            {
              text: {
                content: request,
              },
            },
          ],
        },
        "Response Summary": {
          rich_text: [
            {
              text: {
                content: summary || "No summary",
              },
            },
          ],
        },
      },
    });

    res.status(200).json({ message: "Page created", data: response });
  } catch (error) {
    console.error("❌ ERROR Notion write:", error);
    res.status(500).json({ message: "Server error", error });
  }
}
