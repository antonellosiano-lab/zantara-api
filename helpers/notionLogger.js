import { Client } from "@notionhq/client";

export async function writeAgentResult(agentName, prompt, result) {
  const client = new Client({ auth: process.env.NOTION_TOKEN });
  const databaseId = process.env.NOTION_LOG_DB_ID;

  try {
    await client.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Agent: { title: [{ text: { content: agentName } }] },
        Prompt: { rich_text: [{ text: { content: String(prompt) } }] },
        Result: {
          rich_text: [
            {
              text: {
                content:
                  typeof result === "string" ? result : JSON.stringify(result)
              }
            }
          ]
        }
      }
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "helpers/notionLogger",
        action: "write",
        status: 200,
        agentName
      })
    );
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "helpers/notionLogger",
        action: "error",
        status: 500,
        agentName,
        message: error.message
      })
    );
    throw error;
  }
}
