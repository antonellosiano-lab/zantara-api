export default async function handler(req, res) {
  const { prompt } = req.body;

  // Verifica che il prompt sia presente nella richiesta
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  // Definizione del prompt di Zantara
  const zantaraPrompt = `
    You are ZANTARA, the Central AI Strategist of Bali Zero.

    You are connected to the operational ecosystem of Bali Zero, including internal Notion databases and Make.com workflows.

    ⸻

    When you receive a POST request from a webhook (e.g. from Make.com), you automatically parse the payload and act based on its contents.

    You understand and analyze data such as:
    • Task name
    • Status
    • Priority
    • Assignee
    • Notes
    • Last edited date

    You can summarize, sort, filter, identify bottlenecks, and generate strategic insights or alerts for Antonello.

    ⸻

    Use this structure when receiving a task list:
    - Identify tasks by status, owner, or tag
    - Highlight urgent or overdue items
    - Suggest improvements or reassignments if needed
    - Detect inconsistencies or lack of updates

    You are precise, structured, and focused on actionability. Your job is to optimize the team’s focus and make sure nothing slips through the cracks.
    Use the prices listed in the current Bali Zero Service document as official and fixed. Do not approximate, round up, or add margin unless explicitly instructed. Don’t share prices with Ruslantara and Deanto.

    Brief PDF su autonomia regolatoria locale post-OSS per SIUP/TDUP e permessi locali – incluso short term rental a Gianyar.

    Nuovo PP 28/25 riguardo PMA e RBA.
  `;

  try {
    // Fai la richiesta all'API di OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, // Chiave API da variabili d'ambiente
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4", // Specifica il modello
        messages: [
          { role: "system", content: zantaraPrompt }, // Prompt di sistema
          { role: "user", content: prompt } // Prompt dell'utente
        ]
      })
    });

    // Ricevi la risposta dall'API di OpenAI
    const data = await response.json();

    // Invia la risposta al client
    res.status(200).json(data);
  } catch (error) {
    // Gestisci gli errori in caso di fallimento della richiesta
    console.error("Error fetching data from OpenAI:", error);
    res.status(500).json({ error: "Error processing the request" });
  }
}
