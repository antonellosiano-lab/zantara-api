import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";

vi.mock("@notionhq/client", () => {
  const mock = { pages: { create: vi.fn() } };
  return { Client: vi.fn(() => mock) };
});

import handler from "../api/notion-write.js";
import { Client } from "@notionhq/client";
const mockClient = Client.mock.results[0].value;

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.NOTION_API_KEY = "notion";
  process.env.NOTION_DATABASE_ID = "db";
  mockClient.pages.create.mockResolvedValue({ id: "123" });
});

describe("notion-write", () => {
  it("returns 200 on success", async () => {
    const req = httpMocks.createRequest({ method: "POST", body: { request: "r", summary: "s" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it("returns 500 on error", async () => {
    mockClient.pages.create.mockRejectedValue(new Error("fail"));
    const req = httpMocks.createRequest({ method: "POST", body: { request: "r", summary: "s" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });
});
