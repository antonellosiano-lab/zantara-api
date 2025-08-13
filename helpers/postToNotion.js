export async function postToNotion({ request, summary }) {
  const token = process.env.ZANTARA_API_KEY;
  try {
    const response = await fetch("/api/notion-write", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ summary })
    });

    const json = await response.json();

    const log = {
      timestamp: new Date().toISOString(),
      route: "/api/notion-write",
      status: response.status
    };
    const userIP = request?.headers?.["x-forwarded-for"];
    if (userIP) {
      log.userIP = userIP;
    }
    console.log(JSON.stringify(log));

    if (json.success) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.error };
  } catch (error) {
    const log = {
      timestamp: new Date().toISOString(),
      route: "/api/notion-write",
      status: 500
    };
    const userIP = request?.headers?.["x-forwarded-for"];
    if (userIP) {
      log.userIP = userIP;
    }
    console.log(JSON.stringify(log));
    return { success: false, error: error.message };
  }
}
