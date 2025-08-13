import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import { triggerScenarioHandler } from "../handlers/triggerScenarioHandler.js";
import { resetRedisForTest } from "../helpers/redisClient.js";

beforeEach(async () => {
  process.env.OPENAI_API_KEY = "test";
  process.env.MAKE_API_TOKEN = "make-test";
  process.env.RATE_LIMIT_MAX_REQUESTS = "100";
  await resetRedisForTest();
});

describe("triggerScenarioHandler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await triggerScenarioHandler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST", body: { scenario_id: "1", webhook_url: "https://example.com", payload: {} } });
    const res = httpMocks.createResponse();
    await triggerScenarioHandler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when fields missing", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await triggerScenarioHandler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { scenario_id: "1", webhook_url: "https://example.com", payload: {}, requester: "Ruslantara" }, headers: { "x-forwarded-for": "5.5.5.5" } });
    const res = httpMocks.createResponse();
    await triggerScenarioHandler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 200 on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ result: "ok" }) });
    const req = httpMocks.createRequest({ method: "POST", body: { scenario_id: "1", webhook_url: "https://example.com", payload: {} }, headers: { "x-forwarded-for": "6.6.6.6" } });
    const res = httpMocks.createResponse();
    await triggerScenarioHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData()).success).toBe(true);
  });
});
