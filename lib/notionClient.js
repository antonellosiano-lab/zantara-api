import { Client } from "@notionhq/client";

/**
 * Return a Notion client instance using NOTION_API_KEY.
 * @returns {Client}
 * @throws {Error} when NOTION_API_KEY missing
 */
export function getNotionClient() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      action: "missingNotionKey"
    }));
    throw new Error("Missing Notion API Key");
  }
  return new Client({ auth: apiKey });
}

/**
 * Save agent output to a Notion database.
 * @param {Object} params
 * @param {string} params.databaseId Notion database ID
 * @param {string} params.agent Agent identifier
 * @param {string} params.output Output content
 */
export async function saveAgentOutput({ databaseId, agent, output }) {
  const client = getNotionClient();
  const payload = {
    parent: { database_id: databaseId },
    properties: {
      Agent: { title: [{ text: { content: agent } }] },
      Output: { rich_text: [{ text: { content: output } }] }
    }
  };
  try {
    await client.pages.create(payload);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      action: "notionPageCreated",
      databaseId
    }));
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      action: "notionPageError",
      message: error.message
    }));
    throw error;
  }
}

