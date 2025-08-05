// /api/notionCallback.js
import axios from 'axios';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing code' });
  }

  try {
    const response = await axios.post('https://api.notion.com/v1/oauth/token', {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.NOTION_REDIRECT_URI,
    }, {
      auth: {
        username: process.env.NOTION_CLIENT_ID,
        password: process.env.NOTION_CLIENT_SECRET,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const accessToken = response.data.access_token;

    res.status(200).json({
      message: 'Notion OAuth success!',
      access_token: accessToken,
      workspace_name: response.data.workspace_name,
    });

  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'OAuth failed', detail: error.response?.data });
  }
}
