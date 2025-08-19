import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import { canvaGenerateHandler } from "../handlers/canvaGenerateHandler.js";
import { canvaStatusHandler } from "../handlers/canvaStatusHandler.js";
import { resetCanvaQueue } from "../helpers/jobQueue.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  resetCanvaQueue();
  vi.useRealTimers();
});

describe("canva job queue", () => {
  it("enqueues job and completes", async () => {
    vi.useFakeTimers();
    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "design" } });
    const res = httpMocks.createResponse();
    await canvaGenerateHandler(req, res);
    expect(res.statusCode).toBe(202);
    const { data: { jobId } } = JSON.parse(res._getData());

    let statusReq = httpMocks.createRequest({ method: "POST", body: { jobId } });
    let statusRes = httpMocks.createResponse();
    await canvaStatusHandler(statusReq, statusRes);
    let body = JSON.parse(statusRes._getData());
    expect(body.data.status).toBe("pending");

    await vi.advanceTimersByTimeAsync(60);

    statusRes = httpMocks.createResponse();
    await canvaStatusHandler(statusReq, statusRes);
    body = JSON.parse(statusRes._getData());
    expect(body.data.status).toBe("completed");
    vi.useRealTimers();
  });

  it("returns 400 when jobId missing", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await canvaStatusHandler(req, res);
    expect(res.statusCode).toBe(400);
  });
});
