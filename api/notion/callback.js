import axios from 'axios';

export default async function handler(req, res) {
  const { code } = req.query;
  const route = "/api/notion/callback";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid `code` parameter' });
  }

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    route,
    action: "envCheck",
    status: 200,
    userIP,
    message: "ENV VARIABLES CHECK"
  }));
  const notionToken = process.env.NOTION_TOKEN;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !notionDatabaseId) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "envValidation",
      status: 500,
      userIP,
      message: "Missing NOTION_TOKEN or NOTION_DATABASE_ID"
    }));
    return res.status(500).json({ error: "Missing environment variables" });
  }

  try {
    // 🔄 Optional: trasformazione del codice in contenuto Notion
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
      action: "success",
      status: 200,
      userIP,
      message: `Entry saved to Notion: ${notionRes.data.id}`
    }));
    return res.status(200).json({ success: true, notionPageId: notionRes.data.id });

  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "error",
      status: 500,
      userIP,
      message: `Error saving to Notion: ${error.response?.data || error.message}`
    }));
    return res.status(500).json({ error: "Failed to save to Notion" });
  }
}
