import { describe, it, expect, beforeEach } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/whatsapp/webhook.js";

beforeEach(() => {
  process.env.ZANTARA_WHATSAPP_TOKEN = "token";
});

describe("whatsapp webhook", () => {
  it("returns challenge for GET", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
      query: { "hub.mode": "subscribe", "hub.verify_token": "token", "hub.challenge": "1234" }
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

  it("returns 200 on valid POST", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: {} });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });
});
