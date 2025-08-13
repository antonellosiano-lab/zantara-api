import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";

vi.mock("@notionhq/client", () => {
  const createMock = vi.fn();
  return {
    Client: vi.fn().mockImplementation(() => ({
      databases: { create: createMock }
    })),
    __esModule: true,
    createMock
  };
});

import handler from "../api/notion-database-create.js";
import { createMock } from "@notionhq/client";

describe("Notion database create handler", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test";
    process.env.NOTION_TOKEN = "test";
    createMock.mockReset();
    createMock.mockResolvedValue({ id: "db" });
  });

  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when OPENAI_API_KEY missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST", body: { parentPageId: "p", title: "t", properties: {} } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 500 when NOTION_TOKEN missing", async () => {
    delete process.env.NOTION_TOKEN;
    const req = httpMocks.createRequest({ method: "POST", body: { parentPageId: "p", title: "t", properties: {} } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when required fields missing", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: {} });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 403 for blocked requester", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { parentPageId: "p", title: "t", properties: {}, requester: "Ruslantara" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("returns 200 and data on success", async () => {
    const body = { parentPageId: "p", title: "Test", properties: {}, requester: "user" };
    const req = httpMocks.createRequest({ method: "POST", body });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(createMock).toHaveBeenCalledWith({
      parent: { type: "page_id", page_id: body.parentPageId },
      title: [{ type: "text", text: { content: body.title } }],
      properties: body.properties
    });
  });
});
