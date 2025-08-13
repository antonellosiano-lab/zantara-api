import { google } from "googleapis";
import { loadToken } from "../../../helpers/tokenStore.js";
import { validateOpenAIKey } from "../../../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../../../helpers/checkBlockedRequester.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: { status: 405, summary: "Method Not Allowed" }
    });
  }

  try {
    validateOpenAIKey();
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/calendar/create-event",
        action: "missingOpenAIKey",
        status: 500
      })
    );
    return res.status(500).json({
      success: false,
      error: { status: 500, summary: error.message }
    });
  }

  try {
    const { summary, start, end, requester } = req.body || {};

    if (isBlockedRequester(requester)) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route: "/api/google/calendar/create-event",
          action: "blockedRequester",
          status: 403,
          requester
        })
      );
      return res.status(403).json({
        success: false,
        error: { status: 403, summary: "Requester is blocked" }
      });
    }

    if (!summary || !start || !end) {
      return res.status(400).json({
        success: false,
        error: { status: 400, summary: "Missing summary, start, or end" }
      });
    }

    const tokens = await loadToken();
    if (!tokens) {
      return res.status(500).json({
        success: false,
        error: { status: 500, summary: "Missing OAuth tokens" }
      });
    }

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    client.setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: client });
    const event = {
      summary,
      start: { dateTime: start },
      end: { dateTime: end }
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/calendar/create-event",
        action: "eventCreated",
        status: 200,
        eventId: response.data.id
      })
    );

    return res.status(200).json({
      success: true,
      data: { status: 200, summary: "Event created", nextStep: null }
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/calendar/create-event",
        action: "error",
        status: 500,
        message: error.message
      })
    );
    return res.status(500).json({
      success: false,
      error: { status: 500, summary: "Internal Server Error" }
    });
  }
}
