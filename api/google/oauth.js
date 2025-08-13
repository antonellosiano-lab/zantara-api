import { google } from "googleapis";
import { saveToken } from "../../helpers/tokenStore.js";
import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../../helpers/checkBlockedRequester.js";

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
        route: "/api/google/oauth",
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
    const { code, requester } = req.body || {};

    if (isBlockedRequester(requester)) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route: "/api/google/oauth",
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

    if (!code) {
      return res.status(400).json({
        success: false,
        error: { status: 400, summary: "Missing code in request body" }
      });
    }

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await client.getToken(code);
    await saveToken(tokens);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/oauth",
        action: "tokenStored",
        status: 200
      })
    );

    return res.status(200).json({
      success: true,
      data: { status: 200, summary: "OAuth tokens stored", nextStep: null }
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/google/oauth",
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
