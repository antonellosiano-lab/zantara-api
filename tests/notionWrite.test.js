import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";

vi.mock("@notionhq/client", () => {
  return {
    Client: vi.fn().mockImplementation(() => ({
      pages: {
        create: vi.fn().mockResolvedValue({ id: "page-id" })
      }
    }))
  };
});

import handler from "../api/notion-write.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.NOTION_TOKEN = "test";
  process.env.NOTION_DATABASE_ID = "db";
});

describe("notion-write handler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.summary).toBe("Method Not Allowed");
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST", body: { request: "hi" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.summary).toBe("Missing OpenAI API Key");
  });

  it("returns 200 on success", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { request: "hi", summary: "sum" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.summary).toBe("Page created");
    expect(data.error).toBeNull();
    expect(data.data).toBeDefined();
  });
});
