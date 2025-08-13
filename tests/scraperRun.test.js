import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";

vi.mock("../helpers/scrape.js", () => ({
  invokeApify: vi.fn(),
  fetchBrowserlessContent: vi.fn()
}));

import handler from "../api/scraper/run.js";
import { invokeApify, fetchBrowserlessContent } from "../helpers/scrape.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  vi.clearAllMocks();
});

describe("scraper run", () => {
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

  it("returns 400 when url missing", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { actorId: "1" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 200 on success", async () => {
    invokeApify.mockResolvedValue({ id: "run1" });
    fetchBrowserlessContent.mockResolvedValue("<html></html>");
    const req = httpMocks.createRequest({
      method: "POST",
      body: { url: "https://example.com", actorId: "123" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
  });

  it("returns 500 on failure", async () => {
    invokeApify.mockRejectedValue(new Error("Apify fail"));
    const req = httpMocks.createRequest({
      method: "POST",
      body: { url: "https://example.com", actorId: "123" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });
});
