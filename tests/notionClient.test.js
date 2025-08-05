import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveAgentOutput } from "../helpers/notionClient.js";

describe("saveAgentOutput", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.NOTION_API_KEY;
  });

  it("throws when Notion API Key missing", async () => {
    await expect(saveAgentOutput("db", "agent", "prompt", "response"))
      .rejects.toThrow("Missing Notion API Key");
  });

  it("calls Notion API when configured", async () => {
    process.env.NOTION_API_KEY = "key";
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({}) });
    await saveAgentOutput("db", "agent", "prompt", "response");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.notion.com/v1/pages",
      expect.objectContaining({ method: "POST" })
    );
  });
});
