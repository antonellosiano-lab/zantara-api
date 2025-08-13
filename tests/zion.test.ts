import { describe, it, expect, beforeEach } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../pages/api/zion.ts";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.ZION_ACTION_KEY = "secret";
});

describe("ZION endpoint", () => {
  it("returns healthcheck on GET", async () => {
    const req = httpMocks.createRequest({ method: "GET", headers: { host: "example.com" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.ok).toBe(true);
  });

  it("requires auth", async () => {
    const req = httpMocks.createRequest({ method: "POST", headers: { "x-zion-key": "wrong" }, body: { action: "log.write", payload: {}, meta: {} } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("handles log.write", async () => {
    const req = httpMocks.createRequest({ method: "POST", headers: { "x-zion-key": "secret" }, body: { action: "log.write", payload: { level: "info" }, meta: {} } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
  });
});
