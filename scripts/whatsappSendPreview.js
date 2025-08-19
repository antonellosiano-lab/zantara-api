const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

(async () => {
  try {
    const res = await fetch(`${baseUrl}/api/whatsapp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: process.argv[2] || "1234567890",
        message: "E2E preview message",
        requester: "preview-script"
      })
    });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
})();
