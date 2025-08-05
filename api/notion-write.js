// /api/notion-write.js

import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DATABASE_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { request, responseSummary, status, date } = req.body;

    const newPage = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: {
        Request: {
          title: [
            {
              text: {
                content: request || 'No request provided',
              },
            },
          ],
        },
        "Response Summary": {
          rich_text: [
            {
              text: {
                content: responseSummary || 'No summary',
              },
            },
          ],
        },
        Status: {
          select: {
            name: status || 'Pending',
          },
        },
        Date: {
          date: {
            start: date || new Date().toISOString(),
          },
        },
      },
    });

    res.status(200).json({ message: 'Success', pageId: newPage.id });
  } catch (error) {
    console.error('Notion API Error:', error.body || error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      detail: error.body || error.message,
    });
  }
}
