export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { code } = req.query;
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: 'Missing or invalid `code` parameter' });
  }

  const log = (level, context, message) => {
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context,
      message
    });
    if (level === 'error') {
      console.error(entry);
    } else {
      console.log(entry);
    }
  };

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    log('error', 'api/notion/callback', 'Missing OpenAI API Key');
    return res.status(500).json({ error: 'Missing OpenAI API Key' });
  }

  log('info', 'api/notion/callback', 'Environment variables check');
  const notionToken = process.env.NOTION_TOKEN;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !notionDatabaseId) {
    log('error', 'api/notion/callback', 'Missing NOTION_TOKEN or NOTION_DATABASE_ID');
    return res.status(500).json({ error: 'Missing environment variables' });
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

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(newEntry)
    });

    const data = await response.json();

    if (!response.ok) {
      log('error', 'api/notion/callback', `Notion API error: ${JSON.stringify(data)}`);
      return res.status(500).json({ error: 'Failed to save to Notion' });
    }

    log('info', 'api/notion/callback', `Entry saved to Notion: ${data.id}`);
    return res.status(200).json({ ok: true });
  } catch (error) {
    log('error', 'api/notion/callback', `Error saving to Notion: ${error.message}`);
    return res.status(500).json({ error: 'Failed to save to Notion' });
  }
}
