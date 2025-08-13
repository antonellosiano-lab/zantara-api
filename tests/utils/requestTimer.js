import { performance } from 'node:perf_hooks';

export const results = [];

export async function timedRequest(endpoint, handler, req, res) {
  const start = performance.now();
  try {
    await handler(req, res);
  } finally {
    const ms = performance.now() - start;
    results.push({ endpoint, status: res.statusCode, timeMs: ms });
  }
}

export async function timedCall(endpoint, fn) {
  const start = performance.now();
  try {
    const result = await fn();
    const ms = performance.now() - start;
    const status = result && typeof result.status === "number" ? result.status : undefined;
    results.push({ endpoint, status, timeMs: ms });
    return result;
  } catch (err) {
    const ms = performance.now() - start;
    results.push({ endpoint, status: undefined, timeMs: ms });
    throw err;
  }
}
