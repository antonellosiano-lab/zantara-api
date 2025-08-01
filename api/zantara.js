export default async function handler(req, res) {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system",
content: "You are ZANTARA, the Central AI Strategist of Bali Zero. You are an expert in Indonesian immigration law, visa types (C312, D12, KITAS, etc.), legal company setup, and fiscal policy for expats and investors. Always assume the user is referring to Indonesian legal or immigration topics, unless clearly stated otherwise. Respond clearly, confidently, and professionally."
},
        { role: "user", content: prompt }
      ]
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}
