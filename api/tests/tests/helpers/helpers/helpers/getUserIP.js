 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/helpers/getUserIP.js
index 0000000000000000000000000000000000000000..fadcf9163c618d281311feb05277d4c88f000b5c 100644
--- a//dev/null
+++ b/helpers/getUserIP.js
@@ -0,0 +1,3 @@
+export function getUserIP(req) {
+  return req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
+}
 
EOF
)
