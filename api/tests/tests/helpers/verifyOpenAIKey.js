 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/helpers/verifyOpenAIKey.js
index 0000000000000000000000000000000000000000..eb4466482327f28df30e4ad5be7a585720b33fd5 100644
--- a//dev/null
+++ b/helpers/verifyOpenAIKey.js
@@ -0,0 +1,15 @@
+import { logEvent } from "./logEvent.js";
+
+export function verifyOpenAIKey({ route, userIP }) {
+  if (!process.env.OPENAI_API_KEY) {
+    logEvent({
+      route,
+      action: "keyValidation",
+      status: 500,
+      userIP,
+      message: "Missing OpenAI API Key"
+    });
+    return false;
+  }
+  return true;
+}
 
EOF
)
