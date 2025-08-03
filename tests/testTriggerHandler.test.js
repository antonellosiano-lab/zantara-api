import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import { testTriggerHandler } from "../handlers/testTriggerHandler.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.MAKE_API_TOKEN = "make-test";
});

describe("testTriggerHandler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await testTriggerHandler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 400 when fields missing", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await testTriggerHandler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 200 on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ result: "ok" }) });
    const req = httpMocks.createRequest({ method: "POST", body: { webhook_url: "url", payload: {} } });
    const res = httpMocks.createResponse();
    await testTriggerHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData()).success).toBe(true);
  });
});
