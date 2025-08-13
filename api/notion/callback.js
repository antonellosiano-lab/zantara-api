import axios from 'axios';

export default async function handler(req, res) {
  const route = "/api/notion/callback";

  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "methodCheck",
      status: 405,
      method: req.method,
      userIP: req.headers["x-forwarded-for"],
    }));
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "envCheck",
      status: 500,
      message: "Missing OpenAI API Key",
      userIP: req.headers["x-forwarded-for"],
    }));
    return res.status(500).json({ success: false, error: "Missing OpenAI API Key" });
  }

  const { code } = req.query;

  if (!code || typeof code !== "string") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "validateCode",
      status: 400,
      message: "Missing or invalid `code` parameter",
      userIP: req.headers["x-forwarded-for"],
    }));
    return res.status(400).json({ success: false, error: "Missing or invalid `code` parameter" });
  }

  const notionToken = process.env.NOTION_TOKEN;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !notionDatabaseId) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "envCheck",
      status: 500,
      message: "Missing NOTION_TOKEN or NOTION_DATABASE_ID",
      userIP: req.headers["x-forwarded-for"],
    }));
    return res.status(500).json({ success: false, error: "Missing environment variables" });
  }

  try {
    const newEntry = {
      parent: { database_id: notionDatabaseId },
      properties: {
        Title: {
          title: [{ text: { content: `Request: ${code}` } }]
        }
      }
    };

    const notionRes = await axios.post(
      'https://api.notion.com/v1/pages',
      newEntry,
      {
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        }
      }
    );

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "saveToNotion",
      status: 200,
      notionPageId: notionRes.data.id,
      userIP: req.headers["x-forwarded-for"],
    }));
    return res.status(200).json({ success: true, data: { notionPageId: notionRes.data.id } });

  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "saveToNotion",
      status: 500,
      error: error.response?.data || error.message,
      userIP: req.headers["x-forwarded-for"],
    }));
    return res.status(500).json({ success: false, error: "Failed to save to Notion" });
  }
}
