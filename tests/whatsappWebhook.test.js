import { describe, it, expect } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/whatsapp/webhook.js";

// This suite is limited to verifying basic webhook behavior.
describe("whatsapp webhook", () => {
  it("returns challenge for GET", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
      query: { "hub.mode": "subscribe", "hub.verify_token": "ZANTARA_WHATSAPP_TOKEN", "hub.challenge": "1234" }
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

  it("returns 200 on POST", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { foo: "bar" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });
});
