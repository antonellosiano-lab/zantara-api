import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import { createAgentHandler } from "../handlers/createAgentHandler.js";
import { resetRedisForTest } from "../helpers/redisClient.js";

const handler = createAgentHandler("Test Agent");

beforeEach(async () => {
  process.env.OPENAI_API_KEY = "test";
  process.env.RATE_LIMIT_MAX_REQUESTS = "100";
  await resetRedisForTest();
});

describe("createAgentHandler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "hi" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when prompt missing", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "hi", requester: "Ruslantara" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 200 on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ result: "ok" })
    });
    const req = httpMocks.createRequest({ method: "POST", body: { prompt: "hi" }, headers: { "x-forwarded-for": "1.1.1.1" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData()).success).toBe(true);
  });

  it("returns 409 on duplicate request", async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ result: "ok" }) });
    const req1 = httpMocks.createRequest({ method: "POST", body: { prompt: "same" }, headers: { "x-forwarded-for": "2.2.2.2" } });
    const res1 = httpMocks.createResponse();
    await handler(req1, res1);
    expect(res1.statusCode).toBe(200);
    const req2 = httpMocks.createRequest({ method: "POST", body: { prompt: "same" }, headers: { "x-forwarded-for": "2.2.2.2" } });
    const res2 = httpMocks.createResponse();
    await handler(req2, res2);
    expect(res2.statusCode).toBe(409);
  });

  it("returns 429 when rate limit exceeded", async () => {
    process.env.RATE_LIMIT_MAX_REQUESTS = "1";
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ result: "ok" }) });
    const req1 = httpMocks.createRequest({ method: "POST", body: { prompt: "a" }, headers: { "x-forwarded-for": "3.3.3.3" } });
    const res1 = httpMocks.createResponse();
    await handler(req1, res1);
    expect(res1.statusCode).toBe(200);
    const req2 = httpMocks.createRequest({ method: "POST", body: { prompt: "b" }, headers: { "x-forwarded-for": "3.3.3.3" } });
    const res2 = httpMocks.createResponse();
    await handler(req2, res2);
    expect(res2.statusCode).toBe(429);
  });
});
