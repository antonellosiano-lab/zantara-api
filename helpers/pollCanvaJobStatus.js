export async function pollCanvaJobStatus(jobId, { interval = 1000, maxAttempts = 10 } = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    route: "helpers/pollCanvaJobStatus",
    action: "start",
    jobId
  }));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`https://api.canva.com/v1/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CANVA_API_KEY}`
        }
      });
      const data = await response.json();
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "helpers/pollCanvaJobStatus",
        action: "poll",
        attempt,
        jobId,
        status: data.status
      }));
      if (data.status === "completed" || data.status === "failed") {
        return data;
      }
    } catch (error) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "helpers/pollCanvaJobStatus",
        action: "error",
        jobId,
        message: error.message
      }));
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    route: "helpers/pollCanvaJobStatus",
    action: "timeout",
    jobId
  }));
  throw new Error("Job polling timed out");
}
