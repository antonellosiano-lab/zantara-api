import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../../helpers/checkBlockedRequester.js";
import { loadTokens } from "../../helpers/googleTokens.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/calendar.create_event",
        action: "methodCheck",
        status: 405,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Method Not Allowed"
      })
    );
    return res.status(405).json({
      success: false,
      status: 405,
      summary: "Method Not Allowed",
      error: "Method Not Allowed",
      nextStep: "Send a POST request"
    });
  }

  try {
    validateOpenAIKey();
  } catch (err) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/calendar.create_event",
        action: "keyValidation",
        status: 500,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: err.message
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: err.message,
      error: err.message,
      nextStep: "Set OPENAI_API_KEY in environment"
    });
  }

  const { summary, start, end, requester, description } = req.body || {};

  if (!summary || !start || !end) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/calendar.create_event",
        action: "bodyValidation",
        status: 400,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Missing summary, start or end"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing summary, start or end",
      error: "Missing summary, start or end",
      nextStep: "Include summary, start and end"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/calendar.create_event",
        action: "blockedRequester",
        status: 403,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Requester is blocked"
      })
    );
    return res.status(403).json({
      success: false,
      status: 403,
      summary: "Requester is blocked",
      error: "Access denied"
    });
  }

  const tokens = await loadTokens();
  if (!tokens?.access_token) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/calendar.create_event",
        action: "tokenLoad",
        status: 500,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: "Missing tokens"
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Missing tokens",
      error: "Missing tokens",
      nextStep: "Authorize with Google OAuth"
    });
  }

  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          summary,
          description,
          start: { dateTime: start },
          end: { dateTime: end }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to create event");
    }
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/calendar.create_event",
        action: "createEvent",
        status: 200,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        success: true
      })
    );
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Event created",
      data,
      nextStep: "Event scheduled"
    });
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/calendar.create_event",
        action: "createEvent",
        status: 500,
        userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        message: error.message
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Failed to create event",
      error: "Failed to create event",
      nextStep: "Check logs and retry"
    });
  }
}
