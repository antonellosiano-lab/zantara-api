import axios from 'axios';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid `code` parameter' });
  }

  console.log("🔐 ENV VARIABLES CHECK:");
  const notionToken = process.env.NOTION_TOKEN;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !notionDatabaseId) {
    console.error("❌ Missing NOTION_TOKEN or NOTION_DATABASE_ID");
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

    console.log("✅ Entry saved to Notion:", notionRes.data.id);
    return res.status(200).json({ success: true, notionPageId: notionRes.data.id });

  } catch (error) {
    console.error("❌ Error saving to Notion:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to save to Notion" });
  }
}
