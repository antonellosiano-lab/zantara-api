import { DEFAULT_ZION_API_TOKEN } from "../constants/zion.js";

export async function postToZion(url, payload) {
  const token = process.env.ZION_API_TOKEN || DEFAULT_ZION_API_TOKEN;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  try {
    return await response.json();
  } catch {
    return {};
  }
}
