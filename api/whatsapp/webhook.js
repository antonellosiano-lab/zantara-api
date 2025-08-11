export default function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === ZANTARA_WHATSAPP_TOKEN) {
      return res.status(200).send(challenge); // deve essere plain text
    }
    return res.sendStatus(403);
  }

  if (req.method === 'POST') {
    // Eventi/messaggi WhatsApp arrivano qui
    console.log('WhatsApp incoming:', JSON.stringify(req.body, null, 2));
    return res.sendStatus(200);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

