 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/helpers/logEvent.js
index 0000000000000000000000000000000000000000..30f439c9fb65f49fc3cd3f321b70d8e671fc4766 100644
--- a//dev/null
+++ b/helpers/logEvent.js
@@ -0,0 +1,16 @@
+export function logEvent({ route, action, status, userIP, message, summary }) {
+  const logObject = {
+    timestamp: new Date().toISOString(),
+    route,
+    action,
+    status,
+    userIP
+  };
+  if (message) {
+    logObject.message = message;
+  }
+  if (summary) {
+    logObject.summary = summary;
+  }
+  console.log(JSON.stringify(logObject));
+}
 
EOF
)
