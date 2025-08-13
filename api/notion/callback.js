export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  // This endpoint only interacts with Notion and does not require OPENAI_API_KEY.
  const userIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  const { code } = req.body || {};

  if (!code || typeof code !== "string") {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion/callback",
        action: "validateBody",
        status: 400,
        userIP,
        error: "Missing or invalid `code` parameter"
      })
    );
    return res
      .status(400)
      .json({ success: false, error: "Missing or invalid `code` parameter" });
  }

  const notionToken = process.env.NOTION_TOKEN;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !notionDatabaseId) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion/callback",
        action: "envCheck",
        status: 500,
        userIP,
        error: "Missing NOTION_TOKEN or NOTION_DATABASE_ID"
      })
    );
    return res
      .status(500)
      .json({ success: false, error: "Missing environment variables" });
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

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify(newEntry)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route: "/api/notion/callback",
          action: "notionCreate",
          status: response.status,
          userIP,
          error: data
        })
      );
      return res
        .status(response.status)
        .json({ success: false, error: "Failed to save to Notion" });
    }

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion/callback",
        action: "notionCreate",
        status: 200,
        userIP,
        notionPageId: data.id
      })
    );
    return res.status(200).json({ success: true, data: { notionPageId: data.id } });
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion/callback",
        action: "notionCreate",
        status: 500,
        userIP,
        error: error.message
      })
    );
    return res
      .status(500)
      .json({ success: false, error: "Failed to save to Notion" });
  }
}
