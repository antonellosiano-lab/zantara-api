import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { validateVisaIndexItems } from "../helpers/validateVisaIndexItems.js";
import { visaIndexItems } from "../constants/visaIndex.js";

export async function visaIndexHandler(req, res) {
  const route = "/api/index/visa";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  if (req.method !== "GET") {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "methodCheck",
        status: 405,
        userIP,
        message: "Method Not Allowed"
      })
    );
    return res.status(405).json({
      success: false,
      status: 405,
      summary: "Method Not Allowed",
      error: "Method Not Allowed",
      nextStep: "Send a GET request"
    });
  }

  try {
    validateOpenAIKey();
  } catch (err) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "keyValidation",
        status: 500,
        userIP,
        message: err.message
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: err.message,
      error: err.message,
      nextStep: "Set OPENAI_API_KEY in environment"
    });
  }

  const { visa_type } = req.query || {};
  let items = visaIndexItems;
  if (visa_type) {
    items = items.filter((item) => item.visa_type === visa_type);
  }

  if (!validateVisaIndexItems(items)) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route,
        action: "validation",
        status: 500,
        userIP,
        message: "Invalid visa items"
      })
    );
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Invalid visa items",
      error: "Invalid visa items",
      nextStep: "Check data source"
    });
  }

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "success",
      status: 200,
      userIP,
      summary: "Visa index retrieved"
    })
  );

  return res.status(200).json({
    success: true,
    status: 200,
    summary: "Visa index retrieved",
    data: { items }
  });
}

