export async function postToWebhook(url, payload) {
  const token = process.env.MAKE_API_TOKEN;
  if (!token) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      action: "missingMakeToken",
      status: 500
    }));
    const error = new Error("Missing Make API Token");
    error.statusCode = 500;
    throw error;
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  try {
    return await response.json();
  } catch {
    return {};
  }
}
