import * as Sentry from "@sentry/node";
import { Logtail } from "@logtail/node";

let logtail;
let initialized = false;

export function initObservability() {
  if (initialized) {
    return { Sentry, logtail };
  }

  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN });
  }

  if (process.env.LOGTAIL_SOURCE_TOKEN) {
    logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
  }

  initialized = true;
  return { Sentry, logtail };
}
