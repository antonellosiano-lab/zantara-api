import { initObservability } from "../../lib/observability.js";
initObservability();


// pages/api/notion/test.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET requests are allowed' });
  }

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_API_KEY || !DATABASE_ID) {
    return res.status(500).json({ error: 'Missing Notion API credentials in .env' });
  }

  const pageData = {
    parent: {
      database_id: DATABASE_ID,
    },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: 'Test ZANTARA',
            },
          },
        ],
      },
      Status: {
        select: {
          name: 'Draft',
        },
      },
    },
  };

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(pageData),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data,
        message: 'Failed to create page in Notion',
      });
    }

    return res.status(200).json({
      message: 'Page created successfully in Notion',
      notionResponse: data,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
