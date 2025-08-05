import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

describe("notionClient", () => {
  it("getNotionClient throws without NOTION_API_KEY", async () => {
    vi.doMock("@notionhq/client", () => ({ Client: vi.fn() }));
    delete process.env.NOTION_API_KEY;
    const { getNotionClient } = await import("../lib/notionClient.js");
    expect(() => getNotionClient()).toThrow("Missing Notion API Key");
  });

  it("saveAgentOutput calls pages.create with expected payload", async () => {
    process.env.NOTION_API_KEY = "test";
    const createMock = vi.fn().mockResolvedValue({});
    vi.doMock("@notionhq/client", () => ({
      Client: vi.fn(() => ({ pages: { create: createMock } }))
    }));
    const { saveAgentOutput } = await import("../lib/notionClient.js");
    await saveAgentOutput({ databaseId: "db123", agent: "Agent", output: "Hello" });
    expect(createMock).toHaveBeenCalledWith({
      parent: { database_id: "db123" },
      properties: {
        Agent: { title: [{ text: { content: "Agent" } }] },
        Output: { rich_text: [{ text: { content: "Hello" } }] }
      }
    });
  });
});

