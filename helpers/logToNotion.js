import { Client } from "@notionhq/client";

export async function logToNotion(agent, summary) {
  const timestamp = new Date().toISOString();
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
    console.log(JSON.stringify({
      timestamp,
      action: "notionLogSkipped",
      status: 500,
      agent,
      message: "Missing Notion credentials"
    }));
    return;
  }

  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  try {
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        Agent: { title: [{ text: { content: agent } }] },
        Summary: { rich_text: [{ text: { content: summary || "N/A" } }] }
      }
    });
    console.log(JSON.stringify({
      timestamp,
      action: "notionLogSuccess",
      status: 200,
      agent
    }));
  } catch (err) {
    console.log(JSON.stringify({
      timestamp,
      action: "notionLogError",
      status: 500,
      agent,
      message: err.message
    }));
  }
}
