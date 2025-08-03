export async function triggerMakeWebhook(data = {}) {
  const webhookURL = "https://hook.eu2.make.com/g5xgemwq5pi9carypqg3go66afg4ucay";

  const payload = {
    source: "Zantara",
    message: "Triggered Make via API",
    timestamp: new Date().toISOString(),
    ...data
  };

  try {
    const res = await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          action: "triggerMakeWebhook",
          status: res.status,
          message: text
        })
      );
      throw new Error(`Make webhook error: ${res.status} - ${text}`);
    }

    try {
      const json = await res.json();
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          action: "triggerMakeWebhook",
          status: 200,
          summary: "Webhook triggered"
        })
      );
      return json;
    } catch {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          action: "triggerMakeWebhook",
          status: 200,
          summary: "Webhook triggered with no JSON"
        })
      );
      return {};
    }
  } catch (err) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: "triggerMakeWebhook",
        status: 500,
        message: err.message
      })
    );
    throw err;
  }
}

