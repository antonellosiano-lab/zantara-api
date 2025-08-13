import { describe, it, expect, beforeEach } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/github/webhook.js";
import { createHmac } from "node:crypto";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.GITHUB_WEBHOOK_SECRET = "secret";
});

describe("github webhook", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when signature missing", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: {} });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 401 for invalid signature", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { test: true },
      headers: { "x-hub-signature-256": "sha256=invalid" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 for valid signature", async () => {
    const body = { test: true };
    const payload = JSON.stringify(body);
    const signature =
      "sha256=" +
      createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
        .update(payload)
        .digest("hex");
    const req = httpMocks.createRequest({
      method: "POST",
      body,
      headers: { "x-hub-signature-256": signature }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
  });
});
