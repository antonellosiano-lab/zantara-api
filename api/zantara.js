 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/api/zantara.js b/api/zantara.js
index c240f53f18b834f2c70427147a6eae2bc29dd18a..02e43a045ede87f594541ec43eec23b2d0cdc01a 100644
--- a/api/zantara.js
+++ b/api/zantara.js
@@ -1,65 +1,80 @@
 export default async function handler(req, res) {
   // Only allow POST requests
   if (req.method !== "POST") {
     console.log(JSON.stringify({
       timestamp: new Date().toISOString(),
       route: "/api/zantara",
       action: "methodCheck",
       status: 405,
       userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
       message: "Method Not Allowed"
     }));
-    return res.status(405).json({ error: "Method Not Allowed" });
+    return res.status(405).json({ success: false, error: "Method Not Allowed" });
   }
 
   // Check that the API key is present in the environment
   if (!process.env.OPENAI_API_KEY) {
     console.log(JSON.stringify({
       timestamp: new Date().toISOString(),
       route: "/api/zantara",
       action: "keyValidation",
       status: 500,
       userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
       message: "Missing OpenAI API Key"
     }));
-    return res.status(500).json({ error: "Missing OpenAI API Key" });
+    return res.status(500).json({ success: false, error: "Missing OpenAI API Key" });
   }
 
-  const { prompt } = req.body;
+  const { prompt, requester } = req.body;
 
   // Check that the prompt is present in the request body
   if (!prompt) {
     console.log(JSON.stringify({
       timestamp: new Date().toISOString(),
       route: "/api/zantara",
       action: "promptValidation",
       status: 400,
       userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
       message: "Missing prompt in request body"
     }));
-    return res.status(400).json({ error: "Missing prompt in request body" });
+    return res.status(400).json({ success: false, error: "Missing prompt in request body" });
+  }
+
+  // Block specific requesters
+  const blockedRequesters = ["Ruslantara", "Deanto"];
+  if (requester && blockedRequesters.some(name => name.toLowerCase() === requester.toLowerCase())) {
+    console.log(JSON.stringify({
+      timestamp: new Date().toISOString(),
+      route: "/api/zantara",
+      action: "blockedRequester",
+      status: 403,
+      userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
+      requester,
+      message: "Requester blocked"
+    }));
+    return res.status(403).json({ success: false, error: "Request denied" });
   }
 
   const zantaraPrompt = `
     You are ZANTARA, the Central AI Strategist of Bali Zero.
 
     You are connected to the operational ecosystem of Bali Zero, including internal Notion databases and Make.com workflows.
 
     ⸻
 
     When you receive a POST request from a webhook (e.g. from Make.com), you automatically parse the payload and act based on its contents.
 
     You understand and analyze data such as:
     • Task name
     • Status
     • Priority
     • Assignee
     • Notes
     • Last edited date
 
     You can summarize, sort, filter, identify bottlenecks, and generate strategic insights or alerts for Antonello.
 
     ⸻
 
     Use this structure when receiving a task list:
     - Identify tasks by status, owner, or tag
diff --git a/api/zantara.js b/api/zantara.js
index c240f53f18b834f2c70427147a6eae2bc29dd18a..02e43a045ede87f594541ec43eec23b2d0cdc01a 100644
--- a/api/zantara.js
+++ b/api/zantara.js
@@ -94,28 +109,28 @@ export default async function handler(req, res) {
     const data = await response.json();
 
     console.log(JSON.stringify({
       timestamp: new Date().toISOString(),
       route: "/api/zantara",
       action: "success",
       status: 200,
       userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
       summary: "Request completed successfully"
     }));
 
     res.status(200).json({
       success: true,
       data
     });
   } catch (error) {
     console.error("Error fetching data from OpenAI:", error);
     console.log(JSON.stringify({
       timestamp: new Date().toISOString(),
       route: "/api/zantara",
       action: "error",
       status: 500,
       userIP: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
       message: "Internal Server Error"
     }));
-    res.status(500).json({ error: "Internal Server Error" });
+    res.status(500).json({ success: false, error: "Internal Server Error" });
   }
 }
 
EOF
)
