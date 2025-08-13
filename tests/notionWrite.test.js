import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";

let handler;
let createMock;

vi.mock("@notionhq/client", () => {
  return {
    Client: class {
      constructor() {
        createMock = vi.fn().mockResolvedValue({ id: "mock-page" });
        this.pages = { create: createMock };
      }
    }
  };
});

beforeEach(async () => {
  vi.resetModules();
  process.env.ZANTARA_API_KEY = "valid";
  process.env.OPENAI_API_KEY = "openai";
  process.env.NOTION_DATABASE_ID = "db";
  process.env.NOTION_TOKEN = "token";
  handler = (await import("../api/notion-write.js")).default;
});

describe("notion-write API", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 401 when Authorization header invalid", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { request: "test", summary: "sum" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 when request or summary missing", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      headers: { authorization: "Bearer valid" },
      body: { request: "only" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 200 on success", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      headers: { authorization: "Bearer valid" },
      body: { request: "test", summary: "sum" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(createMock).toHaveBeenCalled();
  });
});

