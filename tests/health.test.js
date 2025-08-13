import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";

describe("Health endpoint", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.OPENAI_API_KEY = "test";
    process.env.SENTRY_DSN = "dsn";
    process.env.LOGTAIL_SOURCE_TOKEN = "token";
  });

  it("returns 405 for non-POST", async () => {
    const handler = (await import("../api/health.js")).default;
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when dependencies missing", async () => {
    delete process.env.LOGTAIL_SOURCE_TOKEN;
    const handler = (await import("../api/health.js")).default;
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 200 when all dependencies set", async () => {
    const handler = (await import("../api/health.js")).default;
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.summary).toBe("OK");
  });
});
