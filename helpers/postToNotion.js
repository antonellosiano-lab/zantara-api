export async function postToNotion({ request, summary }) {
  try {
    const response = await fetch("/api/notion-write", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.ZANTARA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ request, summary })
    });
    const result = await response.json();
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion-write",
        status: response.status,
        userIP: response.headers.get("x-forwarded-for") || undefined
      })
    );
    if (!response.ok) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result };
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/notion-write",
        status: 500,
        error: error.message
      })
    );
    return { success: false, error: error.message };
  }
}
