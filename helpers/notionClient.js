import { Client } from "@notionhq/client";

export function getNotionClient() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error("Missing NOTION_API_KEY");
  return new Client({ auth: apiKey });
}

export async function saveAgentOutput(databaseId, agentName, prompt, responseText) {
  const client = getNotionClient();
  await client.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Name: { title: [{ text: { content: agentName } }] },
      Prompt: { rich_text: [{ text: { content: prompt } }] },
      Response: { rich_text: [{ text: { content: responseText } }] }
    }
  });
}
