import { PRICEBOOKS } from "../constants/pricebooks.js";
import { pricebookSchema } from "../helpers/pricebookSchema.js";

export default async function pricebookHandler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ success: false, error: "Missing OpenAI API Key" });
  }

  const { code } = req.query;

  try {
    const pricebook = PRICEBOOKS[code];

    if (!pricebook) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        route: `/index/pricebook/${code}`,
        action: "pricebookNotFound",
        status: 404
      }));
      return res.status(404).json({ success: false, error: "Pricebook not found" });
    }

    const response = { success: true, data: pricebook };
    pricebookSchema.parse(response);

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: `/index/pricebook/${code}`,
      action: "getPricebook",
      status: 200
    }));

    return res.status(200).json(response);
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: `/index/pricebook/${code}`,
      action: "getPricebook",
      status: 500,
      error: error.message
    }));
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
