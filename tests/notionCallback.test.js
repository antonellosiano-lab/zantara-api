import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
import handler from "../api/notion/callback.js";
import axios from "axios";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.NOTION_TOKEN = "token";
  process.env.NOTION_DATABASE_ID = "db";
  axios.post.mockReset();
});

describe("notion callback handler", () => {
  it("returns 200 for valid code", async () => {
    axios.post.mockResolvedValue({ data: { id: "abc123" } });
    const req = httpMocks.createRequest({ method: "POST", query: { code: "123" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data.notionPageId).toBe("abc123");
  });

  it("returns 400 for invalid code", async () => {
    const req = httpMocks.createRequest({ method: "POST", query: { code: 123 } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
  });
});

