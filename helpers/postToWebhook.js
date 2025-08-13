import { getMakeApiToken } from "../constants/make.js";

export async function postToWebhook(url, payload) {
  const token = getMakeApiToken();
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
