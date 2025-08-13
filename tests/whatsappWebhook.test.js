import { describe, it, expect, beforeEach } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/whatsapp/webhook.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.ZANTARA_WHATSAPP_TOKEN = "token";
});

describe("whatsapp webhook", () => {
  it("returns challenge for GET", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
      query: {
        "hub.mode": "subscribe",
        "hub.verify_token": "token",
        "hub.challenge": "1234",
      },
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
    const req = httpMocks.createRequest({ method: "POST", body: {} });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("blocks specified requester", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { requester: "Ruslantara" },
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("handles Meta payload idempotently", async () => {
    const metaPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: "wamid.ABCD",
                    text: { body: "hi" },
                    type: "text",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const req1 = httpMocks.createRequest({ method: "POST", body: metaPayload });
    const res1 = httpMocks.createResponse();
    await handler(req1, res1);
    expect(res1.statusCode).toBe(200);
    const data1 = JSON.parse(res1._getData());
    expect(data1.summary).toBe("Event processed");

    const req2 = httpMocks.createRequest({ method: "POST", body: metaPayload });
    const res2 = httpMocks.createResponse();
    await handler(req2, res2);
    expect(res2.statusCode).toBe(200);
    const data2 = JSON.parse(res2._getData());
    expect(data2.summary).toBe("Event already processed");
  });
});
