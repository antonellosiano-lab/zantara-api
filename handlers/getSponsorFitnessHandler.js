import { validateOpenAIKey } from "../helpers/validateOpenAIKey.js";
import { sponsorSchema } from "../constants/sponsorSchema.js";
import { sponsorFitnessData } from "../constants/sponsorFitness.js";

export async function getSponsorFitnessHandler(req, res) {
  const route = "/index/sponsor-fitness";
  const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  if (req.method !== "GET") {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "methodCheck",
      status: 405,
      userIP,
      message: "Method Not Allowed"
    }));
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
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "keyValidation",
      status: 500,
      userIP,
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

  const { sponsorId } = req.query;
  const record = sponsorFitnessData[sponsorId];

  if (!record) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "notFound",
      status: 404,
      userIP,
      message: "Sponsor not found"
    }));
    return res.status(404).json({
      success: false,
      status: 404,
      summary: "Sponsor not found",
      error: "Sponsor not found"
    });
  }

  try {
    sponsorSchema.parse(record);
  } catch (err) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      action: "validationError",
      status: 500,
      userIP,
      message: "Invalid sponsor data"
    }));
    return res.status(500).json({
      success: false,
      status: 500,
      summary: "Invalid sponsor data",
      error: "Invalid sponsor data"
    });
  }

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    route,
    action: "success",
    status: 200,
    userIP,
    summary: "Sponsor fitness retrieved"
  }));

  return res.status(200).json({
    success: true,
    status: 200,
    summary: "Sponsor fitness retrieved",
    data: record
  });
}
