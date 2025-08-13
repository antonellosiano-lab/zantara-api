/**
 * Minimal GitHub API client authenticated via process.env.GITHUB_TOKEN
 * @param {string} path - API path starting with '/'
 * @param {object} options - fetch options
 */
export async function githubClient(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Missing GitHub token");
  }

  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `token ${token}`,
      "User-Agent": "zantara-api",
      ...(options.headers || {})
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "GitHub API request failed");
  }
  return data;
}
