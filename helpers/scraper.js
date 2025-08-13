export async function scrape(url, options = {}) {
  if (!url) {
    throw new Error("URL is required");
  }

  const apifyToken = process.env.APIFY_TOKEN;
  const browserlessKey = process.env.BROWSERLESS_KEY;

  if (apifyToken) {
    try {
      const apifyResponse = await fetch("https://api.apify.com/v2/browser-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apifyToken}`
        },
        body: JSON.stringify({ url, options })
      });

      if (!apifyResponse.ok) {
        throw new Error("Apify request failed");
      }

      const data = await apifyResponse.json();
      return { provider: "apify", data };
    } catch (error) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          provider: "apify",
          action: "scrape",
          status: "fallback",
          error: error.message
        })
      );
    }
  }

  if (browserlessKey) {
    const blResponse = await fetch(
      `https://chrome.browserless.io/content?token=${browserlessKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, options })
      }
    );

    if (!blResponse.ok) {
      throw new Error("Browserless request failed");
    }

    const data = await blResponse.json();
    return { provider: "browserless", data };
  }

  throw new Error("No scraping provider available");
}
