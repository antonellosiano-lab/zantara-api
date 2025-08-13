# Zantara API

## Environment Variables

| Variable | Description |
| --- | --- |
| OPENAI_API_KEY | Secret key for the OpenAI API |
| ZION_ENDPOINT | Relative path to the Zion route (default `/api/zion`) |
| ZION_SERVERS_URL | Base URL for the Zion server (e.g., `https://zion.example.com`) |
| OPENAPI_PATH | Path to the OpenAPI document (`/gpt/openapi.zion.json`) |

To load the OpenAPI document, export:

```bash
export OPENAPI_PATH=/gpt/openapi.zion.json
```
