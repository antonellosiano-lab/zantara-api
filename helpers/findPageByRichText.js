import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function findPageByRichText(database_id, propName, text) {
  const response = await notion.databases.query({
    database_id,
    filter: {
      property: propName,
      rich_text: { equals: text }
    }
  });
  return response.results[0] || null;
}
