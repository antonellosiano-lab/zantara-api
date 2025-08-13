import { describe, it, expect, beforeEach, vi } from "vitest";
import httpMocks from "node-mocks-http";

vi.mock("@notionhq/client", () => {
  const mockNotion = {
    pages: { create: vi.fn(), update: vi.fn() },
    databases: { query: vi.fn() }
  };
  return {
    Client: vi.fn(() => mockNotion),
    __mockNotion: mockNotion
  };
});

vi.mock("../helpers/findPageByRichText.js", () => ({
  findPageByRichText: vi.fn()
}));

const { __mockNotion } = await import("@notionhq/client");
const { findPageByRichText } = await import("../helpers/findPageByRichText.js");
const handler = (await import("../api/zion.js")).default;

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test";
  vi.resetAllMocks();
});

describe("Zion handler", () => {
  it("returns 405 for non-POST", async () => {
    const req = httpMocks.createRequest({ method: "GET", headers: { "x-zion-key": "a" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 401 when header missing", async () => {
    const req = httpMocks.createRequest({ method: "POST" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("returns 500 when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = httpMocks.createRequest({ method: "POST", headers: { "x-zion-key": "a" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 when envelope missing", async () => {
    const req = httpMocks.createRequest({ method: "POST", headers: { "x-zion-key": "a" } });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("updates page when existing found", async () => {
    findPageByRichText.mockResolvedValue({ id: "page123" });
    __mockNotion.pages.update.mockResolvedValue({ id: "page123" });

    const envelope = {
      action: "notion.create_page",
      database_id: "db",
      properties: {
        "Event ID": { rich_text: [{ text: { content: "E1" } }] }
      }
    };

    const req = httpMocks.createRequest({
      method: "POST",
      headers: { "x-zion-key": "a" },
      body: { envelope, requester: "user" }
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(findPageByRichText).toHaveBeenCalled();
    expect(__mockNotion.pages.update).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});
