import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import httpMocks from "node-mocks-http";

const mockCreate = vi.fn();
vi.mock("@notionhq/client", () => ({
  Client: vi.fn().mockImplementation(() => ({
    pages: { create: mockCreate }
  }))
}));

let handler;
beforeAll(async () => {
  handler = (await import("../api/notion-write.js")).default;
});

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.ZANTARA_API_KEY = "secret";
  process.env.NOTION_DATABASE_ID = "db";
  mockCreate.mockReset();
});

describe("notion-write handler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 401 for missing auth", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { request: "r", summary: "s" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 for missing fields", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      headers: { Authorization: "Bearer secret" }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("creates page with tags and date", async () => {
    mockCreate.mockResolvedValue({ id: "1" });
    const req = httpMocks.createRequest({
      method: "POST",
      headers: { Authorization: "Bearer secret" },
      body: {
        request: "hello",
        summary: "world",
        tags: ["tag1"],
        date: "2024-01-01"
      }
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: { database_id: "db" },
        properties: expect.objectContaining({
          Request: expect.anything(),
          "Response Summary": expect.anything(),
          Tags: { multi_select: [{ name: "tag1" }] },
          Date: { date: { start: "2024-01-01" } }
        })
      })
    );
  });
});
