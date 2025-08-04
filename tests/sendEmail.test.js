import { describe, it, expect, beforeEach, vi } from "vitest";
import { sendEmail } from "../helpers/sendEmail.js";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue(true)
    })
  }
}));

describe("sendEmail", () => {
  beforeEach(() => {
    process.env.GMAIL_USER = "user@gmail.com";
    process.env.GMAIL_PASS = "pass";
  });

  it("sends email when credentials exist", async () => {
    await expect(sendEmail({ action: "Test", to: "a@b.com", text: "Hello" })).resolves.not.toThrow();
  });

  it("throws when credentials missing", async () => {
    delete process.env.GMAIL_USER;
    await expect(sendEmail({ action: "Test", to: "a@b.com", text: "Hello" })).rejects.toThrow(
      "Missing Gmail credentials"
    );
  });
});
