import { describe, it, expect, beforeEach } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/whatsapp/webhook.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.ZANTARA_WHATSAPP_TOKEN = "token";
});

describe("whatsapp webhook api", () => {
  it("returns challenge for GET", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
      query: {
        "hub.mode": "subscribe",
        "hub.verify_token": "token",
        "hub.challenge": "1234"
      }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._getData()).toBe("1234");
  });

  it("returns 405 for invalid method", async () => {
    const req = httpMocks.createRequest({ method: "PUT" });
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

  it("blocks specified requester", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { requester: "Ruslantara" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 200 on valid POST", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { message: "hi", requester: "good" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data.message).toBe("hi");
  });
});
