 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/tests/helpers.test.js
index 0000000000000000000000000000000000000000..ffd149da099fa978b6712f45fbc5dd5a38f7214f 100644
--- a//dev/null
+++ b/tests/helpers.test.js
@@ -0,0 +1,29 @@
+import { describe, expect, test, vi } from "vitest";
+import { getUserIP } from "../helpers/getUserIP.js";
+
+vi.mock("../helpers/logEvent.js", () => ({ logEvent: vi.fn() }));
+import { verifyOpenAIKey } from "../helpers/verifyOpenAIKey.js";
+
+describe("getUserIP", () => {
+  test("returns header IP when available", () => {
+    const req = { headers: { "x-forwarded-for": "1.2.3.4" }, socket: { remoteAddress: "5.6.7.8" } };
+    expect(getUserIP(req)).toBe("1.2.3.4");
+  });
+
+  test("falls back to socket IP", () => {
+    const req = { headers: {}, socket: { remoteAddress: "5.6.7.8" } };
+    expect(getUserIP(req)).toBe("5.6.7.8");
+  });
+});
+
+describe("verifyOpenAIKey", () => {
+  test("returns false when key missing", () => {
+    delete process.env.OPENAI_API_KEY;
+    expect(verifyOpenAIKey({ route: "/api/test", userIP: "0.0.0.0" })).toBe(false);
+  });
+
+  test("returns true when key present", () => {
+    process.env.OPENAI_API_KEY = "test";
+    expect(verifyOpenAIKey({ route: "/api/test", userIP: "0.0.0.0" })).toBe(true);
+  });
+});
 
EOF
)
