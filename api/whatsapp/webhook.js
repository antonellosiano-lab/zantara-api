// WhatsApp webhook handler
// Handles verification (GET) and message receipt (POST)

export default async function handler(req, res) {
  const VERIFY_TOKEN = process.env.ZANTARA_WHATSAPP_TOKEN || "ZANTARA_WHATSAPP_TOKEN";
  const route = "/api/whatsapp/webhook";
  const userIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route,
          action: "missingAPIKey",
          status: 500,
          userIP
        })
      );
      return res
        .status(500)
        .json({ success: false, status: 500, summary: "Missing OpenAI API Key" });
    }

    if (req.method === "GET") {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            route,
            action: "verifyWebhook",
            status: 200,
            userIP
          })
        );
        return res.status(200).json({
          success: true,
          status: 200,
          summary: "Verification successful",
          challenge
        });
      }

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route,
          action: "verifyWebhook",
          status: 403,
          userIP
        })
      );
      return res
        .status(403)
        .json({ success: false, status: 403, summary: "Verification failed" });
    }

    if (req.method === "POST") {
      const requester = req.body?.requester;
      if (requester === "Ruslantara" || requester === "Deanto") {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            route,
            action: "blockedUser",
            status: 403,
            userIP
          })
        );
        return res
          .status(403)
          .json({ success: false, status: 403, summary: "Requester blocked" });
      }

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route,
          action: "messageReceived",
          status: 200,
          userIP
        })
      );
      return res
        .status(200)
        .json({ success: true, status: 200, summary: "Message received" });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "invalidMethod",
        status: 405,
        userIP
      })
    );
    return res
      .status(405)
      .json({ success: false, status: 405, summary: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "handlerError",
        status: 500,
        userIP,
        error: error.message
      })
    );
    return res
      .status(500)
      .json({ success: false, status: 500, summary: "Internal Server Error" });
  }
}

