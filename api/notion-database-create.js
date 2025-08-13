import { Client } from "@notionhq/client";
import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../helpers/checkBlockedRequester.js";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  const route = "/api/notion-database-create";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

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
      error: err.message,
      nextStep: "Set OPENAI_API_KEY in environment"
    });
  }

  if (!process.env.NOTION_TOKEN) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "tokenValidation",
        status: 500,
        userIP,
        message: "Missing Notion token"
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Missing Notion token",
      error: "Missing Notion token",
      nextStep: "Set NOTION_TOKEN in environment"
    });
  }

  const { parentPageId, title, properties, requester } = req.body || {};

  if (!parentPageId || !title || !properties) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "payloadValidation",
        status: 400,
        userIP,
        message: "Missing required fields"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing required fields",
      error: "Missing parentPageId, title, or properties",
      nextStep: "Include parentPageId, title, and properties in JSON body"
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
    const database = await notion.databases.create({
      parent: { type: "page_id", page_id: parentPageId },
      title: [{ type: "text", text: { content: title } }],
      properties
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "createDatabase",
        status: 200,
        userIP,
        summary: "Database created"
      })
    );

    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Database created",
      data: database
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
      summary: "Failed to create database",
      error: error.message
    });
  }
}
