const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { request, summary } = req.body;

  try {
    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID,
      },
      properties: {
        Request: {
          title: [
            {
              text: {
                content: request || 'Nessun testo',
              },
            },
          ],
        },
        Response: {
          rich_text: [
            {
              text: {
                content: summary || 'Nessun riassunto',
              },
            },
          ],
        },
      },
    });

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('Errore Notion:', error.body || error);
    res.status(500).json({ error: 'Errore scrittura Notion', detail: error.body });
  }
};
