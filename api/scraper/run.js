import { validateOpenAIKey } from "../../helpers/validateOpenAIKey.js";
import { isBlockedRequester } from "../../helpers/checkBlockedRequester.js";
import { invokeApify, fetchBrowserlessContent } from "../../helpers/scrape.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/scraper/run",
      action: "methodCheck",
      status: 405,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Method Not Allowed"
    }));
    return res.status(405).json({
      success: false,
      status: 405,
      summary: "Method Not Allowed",
      error: "Method Not Allowed",
      nextStep: "Send a POST request"
    });
  }

  try {
    validateOpenAIKey();
  } catch (err) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/scraper/run",
      action: "keyValidation",
      status: 500,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: err.message
    }));
    return res.status(500).json({
      success: false,
      status: 500,
      summary: err.message,
      error: err.message,
      nextStep: "Set OPENAI_API_KEY in environment"
    });
  }

  const { url, actorId, input, apifyToken, browserlessToken, requester } = req.body || {};

  if (!url || !actorId) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/scraper/run",
      action: "payloadValidation",
      status: 400,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Missing url or actorId"
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: "Missing url or actorId",
      error: "Missing url or actorId",
      nextStep: "Include url and actorId in JSON body"
    });
  }

  if (isBlockedRequester(requester)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/scraper/run",
      action: "blockedRequester",
      status: 403,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: "Requester is blocked"
    }));
    return res.status(403).json({
      success: false,
      status: 403,
      summary: "Requester is blocked",
      error: "Access denied"
    });
  }

  try {
    const apifyResult = await invokeApify(actorId, input, apifyToken);
    const browserlessResult = await fetchBrowserlessContent(url, browserlessToken);

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/scraper/run",
      action: "success",
      status: 200,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      summary: "Scraping completed"
    }));

    return res.status(200).json({
      success: true,
      status: 200,
      summary: "Scraping completed",
      data: { apifyResult, browserlessResult }
    });
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/scraper/run",
      action: "error",
      status: 500,
      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      message: error.message
    }));
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Scraping failed",
      error: error.message,
      nextStep: "Check service tokens and retry"
    });
  }
}
