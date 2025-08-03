export function logEvent({ route, action, status, userIP, message, summary }) {
  const logObject = {
    timestamp: new Date().toISOString(),
    route,
    action,
    status,
    userIP
  };
  if (message) {
    logObject.message = message;
  }
  if (summary) {
    logObject.summary = summary;
  }
  console.log(JSON.stringify(logObject));
}
