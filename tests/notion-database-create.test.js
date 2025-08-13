import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";

const createMock = vi.fn();
vi.mock("@notionhq/client", () => ({
  Client: vi.fn().mockImplementation(() => ({
    pages: { create: createMock }
  }))
}));

const modulePath = "../api/notion-write.js";

describe("Notion database create API", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
    createMock.mockReset();
  });

  it("returns 405 for non-POST", async () => {
    const handler = (await import(modulePath)).default;
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when env vars missing", async () => {
    delete process.env.NOTION_TOKEN;
    delete process.env.NOTION_DATABASE_ID;
    const handler = (await import(modulePath)).default;
    const req = httpMocks.createRequest({
      method: "POST",
      body: { request: "Hello" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when request field missing", async () => {
    process.env.NOTION_TOKEN = "token";
    process.env.NOTION_DATABASE_ID = "db";
    const handler = (await import(modulePath)).default;
    const req = httpMocks.createRequest({ method: "POST", body: {} });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 200 on success", async () => {
    process.env.NOTION_TOKEN = "token";
    process.env.NOTION_DATABASE_ID = "db";
    const handler = (await import(modulePath)).default;
    const req = httpMocks.createRequest({
      method: "POST",
      body: { request: "Hi", summary: "Sum" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});

