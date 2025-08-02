import { Client } from '@notionhq/client';

export async function logToNotion(input, event) {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  await notion.pages.create({
    parent: { database_id: process.env.NOTION_DATABASE_ID },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: input.slice(0, 100)
            }
          }
        ]
      },
      Input: {
        rich_text: [
          {
            text: { content: input }
          }
        ]
      },
      Response: {
        rich_text: [
          {
            text: { content: JSON.stringify(event) }
          }
        ]
      }
    }
  });
}
