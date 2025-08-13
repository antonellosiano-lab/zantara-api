import { Client } from "@notionhq/client";

export default async function handler(req, res) {
  const route = "/api/zion";
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
    const baseUrl = `https://${req.headers.host}/api`;
    const endpoint = `${baseUrl}/zion`;
    return res.status(200).json({
      ok: true,
      base_url: baseUrl,
      endpoint,
      ts: new Date().toISOString()
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
      nextStep: "Use GET or POST"
    });
  }

  if (req.headers["x-zion-key"] !== process.env.ZION_ACTION_KEY) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "auth",
      status: 401,
      userIP,
      message: "Invalid key"
    }));
    return res.status(401).json({
      success: false,
      status: 401,
      summary: "Unauthorized",
      error: "Unauthorized"
    });
  }

  const { action, payload, meta = {} } = req.body || {};

  if (!action || !payload) {
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing action or payload",
      error: "Missing action or payload"
    });
  }

  try {
    const start = Date.now();
    let data = {};

    if (action === "log.write") {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "log.write",
        status: 200,
        userIP,
        meta,
        payload
      }));
      data = { logged: true };
    } else if (action === "notion.create_page") {
      const notion = new Client({ auth: process.env.NOTION_TOKEN });
      data = await notion.pages.create(payload);
    } else {
      return res.status(400).json({
        success: false,
        status: 400,
        summary: "Unsupported action",
        error: "Unsupported action"
      });
    }

    const duration = Date.now() - start;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action,
      status: 200,
      userIP,
      duration
    }));

    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Action executed",
      data
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
      error: err.message
    });
  }
}
