import * as Sentry from "@sentry/node";
import { Logtail } from "@logtail/node";

const { SENTRY_DSN, LOGTAIL_SOURCE_TOKEN } = process.env;

if (SENTRY_DSN) {
  Sentry.init({ dsn: SENTRY_DSN });
}

const logtail = LOGTAIL_SOURCE_TOKEN ? new Logtail(LOGTAIL_SOURCE_TOKEN) : null;

export async function logEvent(level, data) {
  const entry = { timestamp: new Date().toISOString(), ...data };
  console.log(JSON.stringify(entry));
  if (logtail && typeof logtail[level] === "function") {
    const { message, ...context } = entry;
    try {
      await logtail[level](message, context);
    } catch (err) {
      console.error("Failed to send log to Logtail", err);
    }
  }
}

export function reportError(error) {
  if (SENTRY_DSN && error) {
    Sentry.captureException(error);
  }
}

export { Sentry, logtail };
