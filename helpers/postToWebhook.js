import { getMakeApiKey } from "../constants/make.js";

export async function postToWebhook(url, payload) {
  const token = getMakeApiKey();
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
