/**
 * Trigger a Make webhook with optional payload.
 * @param {Object} data Optional data to send in request body
 * @returns {Promise<Object>} Parsed JSON response or empty object
 */
export async function triggerMakeWebhook(data = {}) {
  const url = process.env.MAKE_WEBHOOK_URL || "https://example.com";
  const token = process.env.MAKE_API_TOKEN;
  if (!token) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      action: "missingMakeToken",
      status: 500
    }));
    throw new Error("Missing Make API Token");
  }
  const payload = Object.keys(data).length ? data : { module: "Zantara", status: "ACTIVE" };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await response.text();
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      action: "makeWebhookError",
      status: response.status,
      message
    }));
    throw new Error("Make webhook error");
  }

  try {
    const result = await response.json();
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      action: "makeWebhookTriggered",
      status: response.status
    }));
    return result;
  } catch {
    return {};
  }
}

