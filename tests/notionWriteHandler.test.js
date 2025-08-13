import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";

var createMock;
vi.mock("@notionhq/client", () => {
  createMock = vi.fn();
  return {
    Client: vi.fn().mockImplementation(() => ({ pages: { create: createMock } })),
  };
});

import handler from "../api/notion-write.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.NOTION_DATABASE_ID = "db";
  process.env.NOTION_TOKEN = "token";
  createMock.mockReset();
});

describe("notion write handler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST", body: { request: "hi" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when request field missing", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: {} });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 200 on success", async () => {
    createMock.mockResolvedValue({ id: "1" });
    const req = httpMocks.createRequest({ method: "POST", body: { request: "hi", summary: "sum" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData()).success).toBe(true);
  });
});
