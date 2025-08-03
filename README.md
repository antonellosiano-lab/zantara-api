# Zantara API

## Deployment Notes

- Restored `api/zantara` endpoint by replacing placeholder patch files with actual handler, helpers, and constants.
- Added Vitest unit tests for core helpers and handler logic.
- Ensure `OPENAI_API_KEY` is configured in environment before deployment.

Run tests:

```
npm test
```

Deploy with Vercel:

```
vercel --prod
```
