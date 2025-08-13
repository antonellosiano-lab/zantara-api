import crypto from "crypto";
import { getRedisClient } from "./redisClient.js";

const TTL_SECONDS = parseInt(process.env.IDEMPOTENCY_TTL_SECONDS || `${60 * 60 * 24}`, 10);

export async function isDuplicateRequest(body) {
  const client = await getRedisClient();
  const hash = crypto.createHash("sha256").update(JSON.stringify(body || {})).digest("hex");
  const key = `req:${hash}`;
  const existing = await client.get(key);
  if (existing) {
    return true;
  }
  await client.set(key, "1", { EX: TTL_SECONDS });
  return false;
}
