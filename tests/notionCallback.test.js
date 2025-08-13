import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";
import handler from "../api/notion/callback.js";
import axios from "axios";

vi.mock("axios");

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.NOTION_TOKEN = "token";
  process.env.NOTION_DATABASE_ID = "db";
  vi.resetAllMocks();
});

describe("notion callback handler", () => {
  it("returns 405 for non-GET", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "GET", query: { code: "abc" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when code missing", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 200 on success", async () => {
    axios.post.mockResolvedValue({ data: { id: "123" } });
    const req = httpMocks.createRequest({ method: "GET", query: { code: "abc" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data.notionPageId).toBe("123");
    expect(axios.post).toHaveBeenCalled();
  });
});
