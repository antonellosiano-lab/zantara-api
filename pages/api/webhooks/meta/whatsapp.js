// pages/api/webhooks/meta/whatsapp.js

export default function handler(req, res) {
  const VERIFY_TOKEN = process.env.ZANTARA_WHATSAPP_TOKEN || "ZANTARA_WHATSAPP_TOKEN";

  // 1) VERIFICA (GET) – niente check su OPENAI_API_KEY qui
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      res.setHeader("Content-Type", "text/plain");
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }

  // 2) EVENTI (POST) – qui puoi pretendere le tue env se vuoi
  if (req.method === "POST") {
    // Se proprio vuoi, sposta QUI il check su OPENAI_API_KEY
    // if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

    console.log("WhatsApp incoming:", JSON.stringify(req.body || {}, null, 2));
    return res.sendStatus(200);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
