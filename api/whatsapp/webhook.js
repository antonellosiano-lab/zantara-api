export default function handler(req, res) {
  if (req.method === 'GET') {
    // 🔹 Parametri che invia Meta per la verifica
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // 🔹 Il token deve corrispondere a quello nel tuo .env
    if (mode && token) {
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('✅ Webhook WhatsApp verificato');
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    }
  }

  else if (req.method === 'POST') {
    // 📩 Qui arrivano i messaggi/eventi
    console.log('📩 Messaggio WhatsApp ricevuto:', JSON.stringify(req.body, null, 2));

    // Rispondi a Meta con 200 OK
    res.sendStatus(200);
  }

  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Metodo ${req.method} non consentito`);
  }
}
