import axios from 'axios';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid code parameter' });
  }

  console.log("📦 ENV VARIABLES CHECK:");
  console.log("NOTION_TOKEN:", process.env.NOTION_TOKEN ? "✅ LOADED" : "❌ MISSING");
  console.log("NOTION_DATABASE_ID:", process.env.NOTION_DATABASE_ID ? "✅ LOADED" : "❌ MISSING");
  console.log("MAKE_WEBHOOK_URL:", process.env.MAKE_WEBHOOK_URL ? "✅ LOADED" : "❌ MISSING");

  try {
    // 🧠 Aggiungi qui la tua logica per il salvataggio su Notion o Make
    res.status(200).json({ message: "Callback received." });
  } catch (error) {
    console.error("❌ ERROR:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }

  // 👉 Se ti serve, puoi tenere questa chiamata token
  const response = await axios.post('https://api.notion.com/v1/oauth/token', {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: process.env.NOTION_REDIRECT_URI
  }, {
    auth: {
      username: process.env.NOTION_CLIENT_ID,
      password: process.env.NOTION_CLIENT_SECRET
    }
  });

  console.log("🎯 TOKEN RESPONSE:", response.data);
}
