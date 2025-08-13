import { getRedisClient } from "./redisClient.js";

export async function isRateLimited(ip, agent) {
  const windowSeconds = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || "60", 10);
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "60", 10);
  const client = await getRedisClient();
  const key = `rate:${agent}:${ip}`;
  const count = Number(await client.incr(key));
  if (count === 1) {
    await client.expire(key, windowSeconds);
  }
  return count > maxRequests;
}
