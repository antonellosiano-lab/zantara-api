export default function handler(req, res) {
  const VERIFY_TOKEN = process.env.ZANTARA_WHATSAPP_TOKEN || "ZANTARA_WHATSAPP_TOKEN";

  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified successfully");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else if (req.method === "POST") {
    console.log("Incoming webhook:", JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
  } else {
    res.sendStatus(405);
  }
}
