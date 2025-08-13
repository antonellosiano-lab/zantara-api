import Ajv from "ajv";

const ajv = new Ajv();

export const apiRequest = async (path, options = {}) => {
  const { BASE_URL, X_API_KEY } = process.env;
  const url = `${BASE_URL}${path}`;

  const { method = "GET", body } = options;
  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": X_API_KEY,
  };

  const fetchOptions = { method, headers };
  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  return response.json();
};

export { ajv };
