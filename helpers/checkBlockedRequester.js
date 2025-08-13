const blocked = ["ruslantara", "deanto"];

export function isBlockedRequester(name = "") {
  const lower = name.toLowerCase();
  return blocked.some((b) => lower.includes(b));
}
