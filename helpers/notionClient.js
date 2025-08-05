export async function saveAgentOutput(databaseId, agentName, prompt, responseText) {
  const notionKey = process.env.NOTION_API_KEY;
  if (!notionKey) {
    throw new Error("Missing Notion API Key");
  }
  if (!databaseId) {
    throw new Error("Missing Notion Database ID");
  }

  await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionKey}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        Agent: { title: [{ text: { content: agentName } }] },
        Prompt: { rich_text: [{ text: { content: prompt } }] },
        Response: { rich_text: [{ text: { content: responseText } }] }
      }
    })
  });
}
