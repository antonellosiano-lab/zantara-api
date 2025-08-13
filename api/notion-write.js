import { Client } from "@notionhq/client";
import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  const route = "/api/notion-write";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "requestStart",
      status: 200,
      userIP
    })
  );

  if (req.method !== "POST") {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "methodCheck",
        status: 405,
        userIP,
        message: "Method Not Allowed"
      })
    );
    return res.status(405).json({
      success: false,
      status: 405,
      summary: "Method Not Allowed",
      error: "Method Not Allowed"
    });
  }

  try {
    validateOpenAIKey();
  } catch (err) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "keyValidation",
        status: 500,
        userIP,
        message: err.message
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: err.message,
      error: err.message
    });
  }

  const { request, summary, requester } = req.body || {};

  if (!request) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "requestValidation",
        status: 400,
        userIP,
        message: "Missing request in body"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing request in body",
      error: "Missing request in body"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "blockedRequester",
        status: 403,
        userIP,
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

  try {
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        Request: {
          title: [{ text: { content: request } }],
        },
        "Response Summary": {
          rich_text: [{ text: { content: summary || "N/A" } }],
        },
      },
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "createPage",
        status: 200,
        userIP,
        summary: "Page created"
      })
    );

    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Page created",
      error: null,
      data: response
    });
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "error",
        status: 500,
        userIP,
        message: error.message
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Internal Server Error",
      error: error.message
    });
  }
}
