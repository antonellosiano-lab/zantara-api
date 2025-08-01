 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/api/zantara.js b/api/zantara.js
index c240f53f18b834f2c70427147a6eae2bc29dd18a..8e210a437710be20d6feb4629bceffcbae0344c5 100644
--- a/api/zantara.js
+++ b/api/zantara.js
@@ -1,65 +1,83 @@
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
+    return res.status(405).json({
+      success: false,
+      status: 405,
+      summary: "Method Not Allowed",
+      error: "Method Not Allowed",
+      nextStep: "Send a POST request"
+    });
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
+    return res.status(500).json({
+      success: false,
+      status: 500,
+      summary: "Missing OpenAI API Key",
+      error: "Missing OpenAI API Key",
+      nextStep: "Set OPENAI_API_KEY in environment"
+    });
   }
 
   const { prompt } = req.body;
 
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
+    return res.status(400).json({
+      success: false,
+      status: 400,
+      summary: "Missing prompt in request body",
+      error: "Missing prompt in request body",
+      nextStep: "Include prompt in JSON body"
+    });
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
index c240f53f18b834f2c70427147a6eae2bc29dd18a..8e210a437710be20d6feb4629bceffcbae0344c5 100644
--- a/api/zantara.js
+++ b/api/zantara.js
@@ -82,40 +100,48 @@ export default async function handler(req, res) {
         "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, // API key from environment variables
         "Content-Type": "application/json"
       },
       body: JSON.stringify({
         model: "gpt-4",
         messages: [
           { role: "system", content: zantaraPrompt },
           { role: "user", content: prompt }
         ]
       })
     });
 
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
+      status: 200,
+      summary: "Request completed successfully",
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
+    res.status(500).json({
+      success: false,
+      status: 500,
+      summary: "Internal Server Error",
+      error: "Internal Server Error",
+      nextStep: "Check server logs and retry"
+    });
   }
 }
 
EOF
)
