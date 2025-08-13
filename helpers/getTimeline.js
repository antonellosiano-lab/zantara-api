import { timelineSchema } from "../constants/timelineSchema.js";

export async function getTimeline(timelineId) {
  const url = `${process.env.BASE_URL || ""}/index/timeline/${timelineId}`;

  const response = await fetch(url, { method: "GET" });
  const data = await response.json();

  if (!Array.isArray(data.steps)) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: url,
        action: "stepsCheck",
        status: 500,
        message: "Invalid timeline data",
      })
    );
    throw new Error("Invalid timeline data");
  }

  for (const step of data.steps) {
    if (!timelineSchema(step)) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route: url,
          action: "timelineValidation",
          status: 500,
          message: "Invalid step structure",
        })
      );
      throw new Error("Invalid step structure");
    }
  }

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      route: url,
      action: "getTimeline",
      status: 200,
      summary: "Timeline fetched",
    })
  );

  return data;
}
