import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@notionhq/client", () => {
  const create = vi.fn();
  const Client = vi.fn().mockImplementation(() => ({ pages: { create } }));
  return { Client, __createMock: create };
});

import { getNotionClient, saveAgentOutput } from "../helpers/notionClient.js";
import { Client, __createMock } from "@notionhq/client";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getNotionClient", () => {
  it("throws when NOTION_API_KEY missing", () => {
    delete process.env.NOTION_API_KEY;
    expect(() => getNotionClient()).toThrow("Missing NOTION_API_KEY");
  });

  it("returns client when key exists", () => {
    process.env.NOTION_API_KEY = "test";
    const client = getNotionClient();
    expect(Client).toHaveBeenCalledWith({ auth: "test" });
    expect(client).toBeTruthy();
  });
});

describe("saveAgentOutput", () => {
  it("creates a page in Notion", async () => {
    process.env.NOTION_API_KEY = "test";
    await saveAgentOutput("db", "agent", "prompt", "response");
    expect(__createMock).toHaveBeenCalledWith({
      parent: { database_id: "db" },
      properties: {
        Name: { title: [{ text: { content: "agent" } }] },
        Prompt: { rich_text: [{ text: { content: "prompt" } }] },
        Response: { rich_text: [{ text: { content: "response" } }] }
      }
    });
  });
});
