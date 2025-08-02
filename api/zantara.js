export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/zantara",
      action: "methodCheck",
      status: 405,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Method Not Allowed"
    }));
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  // Check that the API key is present in the environment
  if (!process.env.OPENAI_API_KEY) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/zantara",
      action: "keyValidation",
      status: 500,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Missing OpenAI API Key"
    }));
    return res.status(500).json({ success: false, error: "Missing OpenAI API Key" });
  }

  const { prompt, requester } = req.body;

  // Check that the prompt is present in the request body
  if (!prompt) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/zantara",
      action: "promptValidation",
      status: 400,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Missing prompt in request body"
    }));
    return res.status(400).json({ success: false, error: "Missing prompt in request body" });
  }

  // Block specific requesters
  const blockedRequesters = ["Ruslantara", "Deanto"];
  if (requester && blockedRequesters.some(name => name.toLowerCase() === requester.toLowerCase())) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/zantara",
      action: "blockedRequester",
      status: 403,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      requester,
      message: "Requester blocked"
    }));
    return res.status(403).json({ success: false, error: "Request denied" });
  }

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

    Brief PDF on post-OSS local regulatory autonomy for SIUP/TDUP and short-term rental permits in Gianyar.

    New PP 28/25 regarding PMA and RBA.
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, // API key from environment variables
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: zantaraPrompt },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/zantara",
      action: "success",
      status: 200,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      summary: "Request completed successfully"
    }));

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Error fetching data from OpenAI:", error);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/zantara",
      action: "error",
      status: 500,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Internal Server Error"
    }));
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
