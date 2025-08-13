import axios from "axios";
import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";

export default async function handler(req, res) {
  const route = "/api/notion/callback";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  if (req.method !== "GET") {
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
      nextStep: "Send a GET request"
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

  const { code } = req.query;

  if (!code || typeof code !== "string") {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "codeValidation",
        status: 400,
        userIP,
        message: "Missing or invalid `code` parameter"
      })
    );
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing or invalid `code` parameter",
      error: "Missing or invalid `code` parameter",
      nextStep: "Include valid code in query string"
    });
  }

  const notionToken = process.env.NOTION_TOKEN;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !notionDatabaseId) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "envValidation",
        status: 500,
        userIP,
        message: "Missing Notion credentials"
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Missing Notion credentials",
      error: "Missing environment variables",
      nextStep: "Set NOTION_TOKEN and NOTION_DATABASE_ID"
    });
  }

  try {
    // Optional: transform the code into Notion content
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

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "success",
        status: 200,
        userIP,
        summary: "Entry saved to Notion"
      })
    );
    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Entry saved to Notion",
      data: { notionPageId: notionRes.data.id }
    });
  } catch (error) {
    console.error("Error saving to Notion:", error.response?.data || error.message);
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "error",
        status: 500,
        userIP,
        message: "Failed to save to Notion"
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Failed to save to Notion",
      error: "Failed to save to Notion",
      nextStep: "Check server logs and retry"
    });
  }
}
