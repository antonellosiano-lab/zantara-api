export function getMakeApiToken() {
  const token = process.env.MAKE_API_TOKEN;
  if (!token) {
    throw new Error("Missing MAKE_API_TOKEN");
  }
  return token;
}
