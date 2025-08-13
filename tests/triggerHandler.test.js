import { describe, it, expect, beforeEach } from "vitest";
import httpMocks from "node-mocks-http";
import { triggerHandler } from "../handlers/triggerHandler.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.ZANTARA_SECRET_KEY = "secret";
});

describe("triggerHandler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await triggerHandler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 403 for missing auth", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await triggerHandler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST", headers: { Authorization: "Bearer secret" } });
    const res = httpMocks.createResponse();
    await triggerHandler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when prompt missing", async () => {
    const req = httpMocks.createRequest({ method: "POST", headers: { Authorization: "Bearer secret" } });
    const res = httpMocks.createResponse();
    await triggerHandler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      headers: { Authorization: "Bearer secret" },
      body: { prompt: "hi", requester: "Ruslantara" }
    });
    const res = httpMocks.createResponse();
    await triggerHandler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 200 on success", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      headers: { Authorization: "Bearer secret" },
      body: { prompt: "hello" }
    });
    const res = httpMocks.createResponse();
    await triggerHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData()).success).toBe(true);
  });
});

