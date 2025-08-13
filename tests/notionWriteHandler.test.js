import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";

const { pagesCreate } = vi.hoisted(() => ({
  pagesCreate: vi.fn().mockResolvedValue({ id: "123" }),
}));

vi.mock("@notionhq/client", () => ({
  Client: vi.fn().mockImplementation(() => ({ pages: { create: pagesCreate } })),
}));

import handler from "../api/notion-write.js";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  process.env.NOTION_DATABASE_ID = "db";
  pagesCreate.mockClear();
});

describe("notion-write handler", () => {
  it("includes date and tags in payload", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        request: "Task",
        summary: "Done",
        tags: ["a", "b"],
        date: "2024-01-01",
      },
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const call = pagesCreate.mock.calls[0][0];
    expect(call.properties.Date.date.start).toBe(
      new Date("2024-01-01").toISOString()
    );
    expect(call.properties.Tags.multi_select).toEqual([
      { name: "a" },
      { name: "b" },
    ]);
  });

  it("returns 400 for invalid tags", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { request: "Task", tags: 123 },
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
  });
});
