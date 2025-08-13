import { describe, it, expect, vi, beforeEach } from "vitest";
import { findPageByRichText } from "../helpers/findPageByRichText.js";
import { Client } from "@notionhq/client";

vi.mock("@notionhq/client", () => {
  const mockNotion = {
    databases: { query: vi.fn() }
  };
  return {
    Client: vi.fn(() => mockNotion),
    __mockNotion: mockNotion
  };
});

const { __mockNotion } = await import("@notionhq/client");

describe("findPageByRichText", () => {
  beforeEach(() => {
    __mockNotion.databases.query.mockReset();
  });

  it("returns first result when page exists", async () => {
    __mockNotion.databases.query.mockResolvedValue({ results: [{ id: "123" }] });
    const page = await findPageByRichText("db", "Event ID", "1");
    expect(page).toEqual({ id: "123" });
  });

  it("returns null when no page found", async () => {
    __mockNotion.databases.query.mockResolvedValue({ results: [] });
    const page = await findPageByRichText("db", "Event ID", "1");
    expect(page).toBeNull();
  });
});
