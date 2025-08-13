import { scrape } from "../../helpers/scraper.js";
import { isBlockedRequester } from "../../helpers/checkBlockedRequester.js";
import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    validateOpenAIKey();
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/scraper/run",
        action: "missingOpenAIKey",
        status: 500
      })
    );
    return res.status(500).json({ success: false, error: error.message });
  }

  const { url, options = {}, requester } = req.body || {};

  if (isBlockedRequester(requester)) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/scraper/run",
        action: "blockedRequester",
        requester
      })
    );
    return res.status(403).json({ success: false, error: "Access denied" });
  }

  if (!url) {
    return res.status(400).json({ success: false, error: "Missing url in request body" });
  }

  try {
    const result = await scrape(url, options);
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/scraper/run",
        action: "scrape",
        status: 200,
        provider: result.provider,
        url,
        userIP: req.headers["x-forwarded-for"]
      })
    );
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "/api/scraper/run",
        action: "scrape",
        status: 500,
        error: error.message
      })
    );
    return res.status(500).json({ success: false, error: error.message });
  }
}
