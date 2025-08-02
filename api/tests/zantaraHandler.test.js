 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/tests/zantaraHandler.test.js
index 0000000000000000000000000000000000000000..b3ebb07d79922d6f9db5d2701c51010be8f6c4f9 100644
--- a//dev/null
+++ b/tests/zantaraHandler.test.js
@@ -0,0 +1,56 @@
+import { describe, expect, test, vi, beforeEach } from "vitest";
+import { zantaraHandler } from "../handlers/zantaraHandler.js";
+
+function createMockReqRes({ method = "POST", body = {} } = {}) {
+  const req = { method, body, headers: {}, socket: { remoteAddress: "1.1.1.1" } };
+  const res = {
+    statusCode: 200,
+    body: null,
+    status(code) {
+      this.statusCode = code;
+      return this;
+    },
+    json(payload) {
+      this.body = payload;
+      return this;
+    }
+  };
+  return { req, res };
+}
+
+beforeEach(() => {
+  vi.resetAllMocks();
+  process.env.OPENAI_API_KEY = "test";
+  global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: "ok" }) });
+});
+
+describe("zantaraHandler", () => {
+  test("returns 405 for non-POST requests", async () => {
+    const { req, res } = createMockReqRes({ method: "GET" });
+    await zantaraHandler(req, res);
+    expect(res.statusCode).toBe(405);
+    expect(res.body.success).toBe(false);
+  });
+
+  test("returns 400 when prompt is missing", async () => {
+    const { req, res } = createMockReqRes({ body: {} });
+    await zantaraHandler(req, res);
+    expect(res.statusCode).toBe(400);
+    expect(res.body.success).toBe(false);
+  });
+
+  test("returns 403 for blocked requester", async () => {
+    const { req, res } = createMockReqRes({ body: { prompt: "Hello", requester: "Ruslantara" } });
+    await zantaraHandler(req, res);
+    expect(res.statusCode).toBe(403);
+    expect(res.body.success).toBe(false);
+  });
+
+  test("returns 200 for valid request", async () => {
+    const { req, res } = createMockReqRes({ body: { prompt: "Hello" } });
+    await zantaraHandler(req, res);
+    expect(res.statusCode).toBe(200);
+    expect(res.body.success).toBe(true);
+    expect(global.fetch).toHaveBeenCalled();
+  });
+});
 
EOF
)
