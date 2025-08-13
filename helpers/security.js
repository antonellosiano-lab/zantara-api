// Security middleware providing payload validation, rate limiting and idempotency handling.
// Supports in-memory storage by default and allows plugging in Redis via createRedisStore.

const rateLimitBuckets = new Map();

export function createMemoryStore() {
  const memoryStore = new Map();
  return {
    async get(key) {
      return memoryStore.get(key) || null;
    },
    async set(key, value, ttl) {
      memoryStore.set(key, value);
      if (ttl) {
        setTimeout(() => memoryStore.delete(key), ttl).unref();
      }
    }
  };
}

export async function createRedisStore(url) {
  const { createClient } = await import("redis");
  const client = createClient({ url });
  await client.connect();
  return {
    async get(key) {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    },
    async set(key, value, ttl) {
      await client.set(key, JSON.stringify(value), { PX: ttl });
    }
  };
}

function checkRateLimit(identifier, tokens = 60, interval = 60000) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(identifier) || { tokens, last: now };

  if (now - bucket.last >= interval) {
    bucket.tokens = tokens;
    bucket.last = now;
  }

  if (bucket.tokens <= 0) {
    rateLimitBuckets.set(identifier, bucket);
    return true;
  }

  bucket.tokens -= 1;
  rateLimitBuckets.set(identifier, bucket);
  return false;
}

export function withSecurity(handler, options = {}) {
  const {
    rateLimit = { tokens: 60, interval: 60000 },
    idempotencyTTL = 3600000,
    store = createMemoryStore()
  } = options;

  return async function secured(req, res) {
    const route = req.url || req.originalUrl || "unknown";
    const userIP = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";

    if (req.method === "POST") {
      if (!req.body || typeof req.body !== "object") {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            route,
            action: "payloadValidation",
            status: 400,
            userIP,
            message: "Invalid JSON payload"
          })
        );
        return res.status(400).json({
          success: false,
          status: 400,
          summary: "Invalid JSON payload",
          error: "Invalid JSON payload",
          nextStep: "Send a valid JSON body"
        });
      }
    }

    const rateKey = `${userIP}:${rateLimit.tokens}:${rateLimit.interval}`;
    if (rateLimit && checkRateLimit(rateKey, rateLimit.tokens, rateLimit.interval)) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route,
          action: "rateLimit",
          status: 429,
          userIP,
          message: "Too Many Requests"
        })
      );
      return res.status(429).json({
        success: false,
        status: 429,
        summary: "Too Many Requests",
        error: "Too Many Requests",
        nextStep: "Please retry later"
      });
    }

    const idempotencyKey = req.headers["idempotency-key"];
    if (idempotencyKey) {
      const cached = await store.get(idempotencyKey);
      if (cached) {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            route,
            action: "idempotentReplay",
            status: cached.status,
            userIP,
            message: "Replayed idempotent request"
          })
        );
        return res.status(cached.status).json(cached.body);
      }
    }

    let responseBody;
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      responseBody = body;
      return originalJson(body);
    };

    try {
      await handler(req, res);
    } catch (err) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          route,
          action: "handlerError",
          status: 500,
          userIP,
          message: err.message
        })
      );
      return res.status(500).json({
        success: false,
        status: 500,
        summary: "Internal Server Error",
        error: "Internal Server Error",
        nextStep: "Check server logs and retry"
      });
    }

    if (idempotencyKey && responseBody) {
      await store.set(idempotencyKey, { status: res.statusCode, body: responseBody }, idempotencyTTL);
    }
  };
}

export default { withSecurity, createMemoryStore, createRedisStore };

