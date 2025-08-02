export function checkAuthorization(req) {
  const header = req.headers?.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return false;
  return token === process.env.ZANTARA_SECRET_KEY;
}
