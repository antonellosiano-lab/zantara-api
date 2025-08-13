export async function sendNotionUpdate({ request, summary }) {
  const url = process.env.NOTION_WRITE_URL || "https://zantara.vercel.app/api/notion-write";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request, summary })
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    const result = {
      success: response.ok,
      status: response.status,
      summary,
      ...(response.ok ? { data: payload } : { error: payload?.error || payload })
    };

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/helpers/notion-bridge",
      action: "sendNotionUpdate",
      status: response.status
    }));

    return result;
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/helpers/notion-bridge",
      action: "sendNotionUpdateError",
      status: 500,
      message: error.message
    }));

    return { success: false, status: 500, summary, error: error.message };
  }
}
