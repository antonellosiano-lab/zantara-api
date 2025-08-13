import { randomUUID } from "crypto";

const jobs = new Map();

async function processJob(id, payload) {
  await new Promise((resolve) => setTimeout(resolve, 50));
  jobs.set(id, { status: "completed", result: payload });
}

export function enqueueCanvaJob(payload) {
  const id = randomUUID();
  jobs.set(id, { status: "pending", result: null });
  processJob(id, payload).catch((err) => {
    jobs.set(id, { status: "error", result: err.message });
  });
  return id;
}

export function getCanvaJob(id) {
  return jobs.get(id);
}

export function resetCanvaQueue() {
  jobs.clear();
}
