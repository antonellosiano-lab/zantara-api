import { promises as fs } from "fs";
const TOKEN_PATH = "./lib/google_tokens.json";

export async function saveTokens(tokens) {
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

export async function loadTokens() {
  try {
    const data = await fs.readFile(TOKEN_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}
