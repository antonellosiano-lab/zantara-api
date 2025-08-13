import { describe, it, expect, beforeEach } from "vitest";
import httpMocks from "node-mocks-http";
import { visaAnalyzeHandler } from "../handlers/visaAnalyzeHandler.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
});

describe("visaAnalyzeHandler", () => {
  it("returns 400 when nationality missing", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      headers: { "X-API-Key": "abc" },
      body: { visa_type: "tourist" }
    });
    const res = httpMocks.createResponse();
    await visaAnalyzeHandler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 401 when API key missing", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { nationality: "USA", visa_type: "tourist" }
    });
    const res = httpMocks.createResponse();
    await visaAnalyzeHandler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("returns empty updates for unknown visa type", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      headers: { "X-API-Key": "abc" },
      body: { nationality: "USA", visa_type: "unknown" }
    });
    const res = httpMocks.createResponse();
    await visaAnalyzeHandler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.data.updates.length).toBe(0);
    expect(data.data.stale).toBe(true);
  });
});
