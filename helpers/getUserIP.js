export function getUserIP(req) {
  return req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
}
