import { describe, it, expect, beforeEach } from "vitest";
import httpMocks from "node-mocks-http";
import { visaIndexHandler } from "../handlers/visaIndexHandler.js";
import { visaIndexItems } from "../constants/visaIndex.js";

describe("visaIndexHandler", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test";
  });

  it("returns all items when visa_type is not provided", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await visaIndexHandler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.data.items.length).toBe(visaIndexItems.length);
  });

  it("filters items by visa_type", async () => {
    const req = httpMocks.createRequest({ method: "GET", query: { visa_type: "tourist" } });
    const res = httpMocks.createResponse();
    await visaIndexHandler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.data.items.every((item) => item.visa_type === "tourist")).toBe(true);
  });

  it("returns 405 for non-GET", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await visaIndexHandler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await visaIndexHandler(req, res);
    expect(res.statusCode).toBe(500);
  });
});

