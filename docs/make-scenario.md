# ZANTARA → Webhook → Google Calendar + Notion Log

This document describes a Make.com scenario that turns natural language requests from ZANTARA into scheduled Google Calendar events and logs every attempt in Notion.

## 1. Trigger – Custom Webhook
- **Module:** Webhooks > Custom webhook (Instant)
- **Input:** POST request with JSON body `{ "inputText": "Dinner with client Thursday 7pm" }`
- **Output Mapping:** pass `inputText` to the next module.

## 2. Parse Input with OpenAI
- **Module:** OpenAI > Create a completion (GPT‑4)
- **Connection:** uses the `OPENAI_API_KEY` environment variable.
- **Prompt:**
  ```
  Transform the following text into JSON with fields:
  eventTitle, date, startTime, endTime (default 1h after start), location, notes.
  Text: {{inputText}}
  ```
- **Response Handling:** parse JSON to variables `eventTitle`, `date`, `startTime`, `endTime`, `location`, `notes`.

## 3. Create Google Calendar Event
- **Module:** Google Calendar > Create an event
- **Authentication:** use a connected Google account.
- **Fields:**
  - **Title:** `{{eventTitle}}`
  - **Start:** combine `{{date}} {{startTime}}`
  - **End:** combine `{{date}} {{endTime}}`
  - **Description:** `{{notes}}`
  - **Location:** `{{location}}`

## 4. Log Result in Notion
- **Module:** Notion > Create a database item
- **Connection:** Notion token from environment; database ID stored in env.
- **Database:** "Activation Log"
- **Fields:**
  - **Request:** `{{inputText}}`
  - **Response Summary:** e.g. `Meeting with client scheduled for Thursday at 7pm`
  - **Date:** scenario run date (Make variable `{{now}}`)
  - **Status:** set to `✅ Success`

## 5. Error Handling
- Add an error handler route from modules 2 or 3.
- In case of failure, create a Notion item with:
  - **Request:** `{{inputText}}`
  - **Response Summary:** error message
  - **Date:** `{{now}}`
  - **Status:** `❌ Failed`

## 6. Security Notes
- Store `OPENAI_API_KEY`, Notion token, and Notion database ID in Make environment variables.
- Do not hardcode secrets in the scenario.

This automation allows ZANTARA to schedule calendar events from natural language and maintain a complete activation log in Notion.
