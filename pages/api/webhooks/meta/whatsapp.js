export default async function handler(req, res) {
  const route = "/api/webhooks/meta/whatsapp";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  if (!process.env.OPENAI_API_KEY) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "keyValidation",
      status: 500,
      userIP,
      message: "Missing OpenAI API Key"
    }));
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Missing OpenAI API Key",
      error: "Missing OpenAI API Key",
      nextStep: "Set OPENAI_API_KEY in environment"
    });
  }

  if (req.method === "GET") {
    const challenge = req.query["hub.challenge"];
    if (challenge) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "verify",
        status: 200,
        userIP,
        summary: "Webhook verified"
      }));
      return res.status(200).send(challenge);
    }
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "verify",
      status: 400,
      userIP,
      message: "Missing hub.challenge"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing hub.challenge",
      error: "Missing hub.challenge",
      nextStep: "Include hub.challenge query parameter"
    });
  }

  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "methodCheck",
      status: 405,
      userIP,
      message: "Method Not Allowed"
    }));
    return res.status(405).json({
      success: false,
      status: 405,
      summary: "Method Not Allowed",
      error: "Method Not Allowed",
      nextStep: "Send a POST request"
    });
  }

  const { requester } = req.body || {};
  if (requester === "Ruslantara" || requester === "Deanto") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "blockedRequester",
      status: 403,
      userIP,
      message: "Requester is blocked"
    }));
    return res.status(403).json({
      success: false,
      status: 403,
      summary: "Requester is blocked",
      error: "Access denied"
    });
  }

  try {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "received",
      status: 200,
      userIP,
      summary: "Webhook received"
    }));
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Webhook received",
      data: "OK"
    });
  } catch (err) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "error",
      status: 500,
      userIP,
      message: err.message
    }));
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Internal Server Error",
      error: "Internal Server Error",
      nextStep: "Check server logs and retry"
    });
  }
}
