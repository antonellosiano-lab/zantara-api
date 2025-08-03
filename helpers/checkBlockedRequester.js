const blocked = ["Ruslantara", "Deanto"];

export function isBlockedRequester(name = "") {
  return blocked.includes(name);
}
