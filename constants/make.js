export function getMakeApiKey() {
  const key = process.env.MAKE_API_KEY;
  if (!key) {
    throw new Error("Missing Make API Key");
  }
  return key;
}

