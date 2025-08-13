export async function sendNotionUpdate({ request, summary }) {
  const url = process.env.NOTION_WRITE_URL || "https://zantara.vercel.app/api/notion-write";

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "helpers/notionBridge",
      action: "start",
      status: 0,
      summary,
      request
    })
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ request, summary })
    });

    const data = await response.json().catch(() => ({}));
    const success = response.ok;

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "helpers/notionBridge",
        action: "response",
        status: response.status,
        success
      })
    );

    if (!success) {
      return {
        success: false,
        status: response.status,
        summary: "Failed to update Notion",
        error: data.error || "Request failed"
      };
    }

    return {
      success: true,
      status: response.status,
      summary: "Notion updated",
      data
    };
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "helpers/notionBridge",
        action: "error",
        status: 500,
        message: error.message
      })
    );
    return {
      success: false,
      status: 500,
      summary: "Internal Error",
      error: error.message
    };
  }
}
