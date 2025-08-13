import axios from "axios";

const log = (e) => console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  route: e.route,
  action: e.action,
  status: e.status,
  message: e.message,
  userIP: e.userIP,
  meta: e.meta || null
}));

export default async function handler(req, res) {
  const route = "/api/notion/callback";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  if (req.method !== "GET") {
    log({ route, action: "methodCheck", status: 405, message: "Method Not Allowed", userIP });
    return res.status(405).json({
      success: false,
      status: 405,
      summary: "Method Not Allowed",
      error: "Method Not Allowed",
      nextStep: "Send a GET request"
    });
  }

  const { code } = req.query;

  if (!code || typeof code !== "string") {
    log({ route, action: "validation", status: 400, message: "Missing or invalid `code` parameter", userIP });
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing or invalid `code` parameter",
      error: "Missing or invalid `code` parameter",
      nextStep: "Include code query parameter"
    });
  }

  const notionToken = process.env.NOTION_API_KEY;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !notionDatabaseId) {
    log({ route, action: "envCheck", status: 500, message: "Missing environment variables", userIP });
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Missing environment variables",
      error: "Missing environment variables",
      nextStep: "Set NOTION_API_KEY and NOTION_DATABASE_ID"
    });
  }

  try {
    const newEntry = {
      parent: { database_id: notionDatabaseId },
      properties: {
        Title: {
          title: [{ text: { content: `Request: ${code}` } }]
        }
      }
    };

    const notionRes = await axios.post(
      "https://api.notion.com/v1/pages",
      newEntry,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28"
        }
      }
    );

    log({ route, action: "success", status: 200, message: "Entry saved to Notion", userIP });
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Entry saved to Notion",
      data: { notionPageId: notionRes.data.id }
    });
  } catch (error) {
    log({ route, action: "error", status: 500, message: "Failed to save to Notion", userIP, meta: error.message });
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Failed to save to Notion",
      error: "Failed to save to Notion",
      nextStep: "Check server logs and retry"
    });
  }
}
