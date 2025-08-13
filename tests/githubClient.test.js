import { describe, it, expect, vi, beforeEach } from "vitest";
import { githubClient } from "../helpers/githubClient.js";

describe("githubClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when token missing", async () => {
    delete process.env.GITHUB_TOKEN;
    await expect(githubClient("/user")).rejects.toThrow("Missing GitHub token");
  });

  it("adds auth header and returns data", async () => {
    process.env.GITHUB_TOKEN = "abc123";
    const mockData = { ok: true };
    global.fetch = vi.fn(async (url, options) => ({
      ok: true,
      json: async () => mockData
    }));
    const data = await githubClient("/test");
    expect(data).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.github.com/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "token abc123"
        })
      })
    );
  });

  it("throws on non-ok response", async () => {
    process.env.GITHUB_TOKEN = "abc123";
    global.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({ message: "Bad" })
    }));
    await expect(githubClient("/bad")).rejects.toThrow("Bad");
  });
});
