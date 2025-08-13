import { promises as fs } from "fs";
import path from "path";

const tokenPath = path.join(process.cwd(), "lib", "googleToken.json");

export async function saveToken(token) {
  await fs.writeFile(tokenPath, JSON.stringify(token), "utf8");
}

export async function loadToken() {
  try {
    const data = await fs.readFile(tokenPath, "utf8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}
