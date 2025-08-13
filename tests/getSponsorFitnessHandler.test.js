import { describe, it, expect, beforeEach } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../index/sponsor-fitness/[sponsorId].js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
});

describe("getSponsorFitnessHandler", () => {
  it("returns 405 for non-GET", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "GET", query: { sponsorId: "TEST-ENTITY-001" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 404 for unknown sponsor", async () => {
    const req = httpMocks.createRequest({ method: "GET", query: { sponsorId: "UNKNOWN" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(404);
  });

  it("returns 200 with sponsor data", async () => {
    const req = httpMocks.createRequest({ method: "GET", query: { sponsorId: "TEST-ENTITY-001" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.kbli)).toBe(true);
    expect(Array.isArray(data.data.fit_for)).toBe(true);
    expect(Array.isArray(data.data.gaps)).toBe(true);
    expect(Array.isArray(data.data.actions)).toBe(true);
  });
});
