import { createClient } from "redis";

let client;

function createMemoryClient() {
  const store = new Map();
  return {
    store,
    async incr(key) {
      const value = (store.get(key) || 0) + 1;
      store.set(key, value);
      return value;
    },
    async expire(key, seconds) {
      if (!store.has(key)) return;
      setTimeout(() => store.delete(key), seconds * 1000);
    },
    async get(key) {
      const value = store.get(key);
      return value === undefined ? null : value.toString();
    },
    async set(key, value, options = {}) {
      store.set(key, value);
      if (options.EX) {
        setTimeout(() => store.delete(key), options.EX * 1000);
      }
    },
  };
}

export async function getRedisClient() {
  if (!client) {
    if (process.env.REDIS_URL) {
      client = createClient({ url: process.env.REDIS_URL });
      client.on("error", (err) => console.error("Redis error", err));
      await client.connect();
    } else {
      client = createMemoryClient();
    }
  }
  return client;
}

export async function resetRedisForTest() {
  if (client && client.store) {
    client.store.clear();
  }
}
