import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/canva/generate.js";
import { pollCanvaJobStatus } from "../helpers/pollCanvaJobStatus.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.CANVA_API_KEY = "canva";
});

describe("canva generate handler", () => {
  it("queues job and returns job ID", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ jobId: "job123" })
    });
    const req = httpMocks.createRequest({ method: "POST", body: { designId: "d1" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData()).data.jobId).toBe("job123");
  });
});

describe("pollCanvaJobStatus", () => {
  it("retrieves completed status", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: () => Promise.resolve({ status: "pending" }) })
      .mockResolvedValueOnce({ json: () => Promise.resolve({ status: "completed" }) });
    global.fetch = fetchMock;
    const result = await pollCanvaJobStatus("job123", { interval: 1, maxAttempts: 5 });
    expect(result.status).toBe("completed");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
