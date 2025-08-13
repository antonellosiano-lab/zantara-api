export const DEFAULT_MAKE_API_TOKEN = process.env.MAKE_API_TOKEN;
if (!DEFAULT_MAKE_API_TOKEN) {
  throw new Error("MAKE_API_TOKEN is not defined");
}
