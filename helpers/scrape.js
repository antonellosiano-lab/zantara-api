export async function invokeApify(actorId, input = {}, token) {
  const response = await fetch(`https://api.apify.com/v2/actor-tasks/${actorId}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Apify request failed with status ${response.status}`);
  }

  return await response.json();
}

export async function fetchBrowserlessContent(url, token) {
  const response = await fetch(`https://chrome.browserless.io/content?token=${token}&url=${encodeURIComponent(url)}`);

  if (!response.ok) {
    throw new Error(`Browserless request failed with status ${response.status}`);
  }

  return await response.text();
}
