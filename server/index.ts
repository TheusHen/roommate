import { captureError } from "../sentry/ts/sentry";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { MongoDBHandler } from "../mongodb/index";

const analyticsConfigPath = path.join(__dirname, "../config/analytics_config.json");
let analyticsOption = "None (not recommended)";
if (fs.existsSync(analyticsConfigPath)) {
  try {
    const configRaw = fs.readFileSync(analyticsConfigPath, "utf8");
    const config = JSON.parse(configRaw);
    analyticsOption = config.analytics || analyticsOption;
  } catch {}
}

const passwordFilePath = path.join(__dirname, "../config/api_password.txt");
let apiPassword: string;

function generatePassword(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

if (fs.existsSync(passwordFilePath)) {
  apiPassword = fs.readFileSync(passwordFilePath, "utf8").trim();
} else {
  apiPassword = generatePassword(16);
  fs.writeFileSync(passwordFilePath, apiPassword, "utf8");
  console.log(`[INFO] Generated API password: ${apiPassword}`);
}

console.log(`[INFO] API password for authorization: ${apiPassword}`);

// Initialize MongoDB Handler
const mongoHandler = new MongoDBHandler();
let mongoHandlerConnected = false;

async function initMongoDB() {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`[INFO] Attempting to connect to MongoDB (attempt ${attempt}/${maxRetries})...`);
      const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";
      console.log("[INFO] MongoDB URI:", mongoUri.replace(/\/\/.*@/, "//<credentials>@")); // Hide credentials in logs
      
      // Set a timeout for the connection attempt
      const connectPromise = mongoHandler.connect();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('MongoDB connection timeout after 10 seconds')), 10000);
      });
      
      await Promise.race([connectPromise, timeoutPromise]);
      mongoHandlerConnected = true;
      console.log("[INFO] MongoDB Handler initialized successfully");
      return; // Success, exit the retry loop
    } catch (error) {
      console.error(`[ERROR] MongoDB connection attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error("[ERROR] Failed to initialize MongoDB Handler after all retry attempts");
        console.error("[ERROR] MongoDB URI provided:", (process.env.MONGO_URI ? "Yes (from env)" : "No (using default)"));
        console.error("[ERROR] Memory endpoints will return 503 until MongoDB is available");
        mongoHandlerConnected = false;
        return;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`[INFO] Retrying MongoDB connection in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function sendNightwatch(error: any) {
  const apiUrl = process.env.NIGHTWATCH_API_URL;
  const apiKey = process.env.NIGHTWATCH_API_KEY;
  if (!apiUrl || !apiKey) return;
  await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ error: error?.message || String(error) }),
  });
}

function handleError(error: any) {
  if (analyticsOption === "Sentry") {
    captureError(error);
  } else if (analyticsOption === "Nightwatch") {
    sendNightwatch(error);
  } else if (analyticsOption === "Both") {
    captureError(error);
    sendNightwatch(error);
  }
}

function checkAuthorization(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${apiPassword}`) {
    return false;
  }
  return true;
}

const FRONTEND_ORIGIN = "https://roommate-delta.vercel.app";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

function withCorsHeaders(resp: Response) {
  const headers = new Headers(resp.headers);
  headers.set("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Allow-Credentials", "true");
  
  console.log("[DEBUG] Applied CORS headers for origin:", FRONTEND_ORIGIN);
  
  return new Response(resp.body, {
    status: resp.status,
    headers,
  });
}

async function logRequest(req: Request, bodyRaw: string | null = null) {
  console.log("==== INCOMING REQUEST ====");
  console.log("URL:", req.url);
  console.log("Method:", req.method);
  console.log("Headers:");
  for (const [k, v] of req.headers.entries()) {
    console.log(`  ${k}: ${v}`);
  }
  if (bodyRaw !== null) {
    console.log("Body RAW:", bodyRaw);
  }
  console.log("==========================");
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function getErrorStack(err: unknown): string {
  if (err instanceof Error && err.stack) {
    return err.stack;
  }
  return "";
}

const server = Bun.serve({
  port: 3000,
  idleTimeout: 255,
  async fetch(req) {
    const url = new URL(req.url);
    const startTime = Date.now();
    const country = Intl.DateTimeFormat().resolvedOptions().locale || "Unknown";

    async function buildResponse(data: any, status = 200) {
      const elapsed = Date.now() - startTime;
      const resp = new Response(
        JSON.stringify({
          ...data,
          elapsed_ms: elapsed,
          server_country: country,
          ping_ms: elapsed,
        }),
        {
          status,
          headers: { "Content-Type": "application/json" },
        }
      );
      return withCorsHeaders(resp);
    }

    if (req.method === "OPTIONS") {
      console.log("[INFO] CORS preflight request received");
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (url.pathname === "/") {
      console.log("[INFO] Root route called");
      return buildResponse({ message: "Roommate: Using Ollama GPT-OSS:20B" });
    }

    if (url.pathname === "/ping") {
      console.log("[INFO] /ping route called");
      return buildResponse({ message: "pong" });
    }

    if (url.pathname === "/health") {
      console.log("[INFO] /health route called");
      return buildResponse({ 
        status: "running",
        mongodb_connected: mongoHandlerConnected,
        mongodb_uri_configured: process.env.MONGO_URI ? true : false,
        services: {
          server: "running",
          mongodb: mongoHandlerConnected ? "connected" : "disconnected"
        }
      });
    }

    if (url.pathname === "/chat" && req.method === "POST") {
      if (!checkAuthorization(req)) {
        return buildResponse({ error: "Unauthorized" }, 401);
      }
      
      // Declare timeout variable at proper scope for the whole endpoint
      let ollamaTimeout: NodeJS.Timeout | null = null;
      
      try {
        const bodyStream = await req.text();
        await logRequest(req, bodyStream);

        let body;
        try {
          body = JSON.parse(bodyStream);
        } catch (jsonErr: unknown) {
          const errMsg = getErrorMessage(jsonErr);
          console.error("[ERROR] JSON.parse failed:", errMsg);
          return buildResponse({
            error: "Failed to parse JSON",
            details: errMsg,
            bodyRaw: bodyStream
          }, 400);
        }

        const { prompt } = body;
        if (!prompt) {
          return buildResponse({ error: "Missing required field: prompt", received: body }, 400);
        }

        console.log(`[REQUEST] /chat with prompt: ${prompt}`);

        // Enrich prompt with user context if MongoDB is available
        let enrichedPrompt = prompt;
        if (mongoHandlerConnected) {
          try {
            // Use a default user ID for now - in a real app this would come from authentication
            const userId = "default-user";
            
            // Save any new information from the prompt
            await mongoHandler.saveMemory(userId, prompt);
            
            // Get relevant memories to enrich the prompt
            const memories = await mongoHandler.getRelevantMemory(userId, prompt);
            
            if (memories.length > 0) {
              const context = memories.map(m => {
                switch (m.type) {
                  case 'pet':
                    if (m.key.endsWith('_name')) {
                      const petType = m.key.replace('_name', '');
                      return `Your ${petType}'s name is ${m.value}`;
                    }
                    break;
                  case 'personal':
                    if (m.key === 'name') return `Your name is ${m.value}`;
                    break;
                  case 'location':
                    if (m.key === 'home_location') return `You live in ${m.value}`;
                    break;
                  case 'work':
                    if (m.key === 'company') return `You work at ${m.value}`;
                    break;
                  case 'preference':
                    if (m.key === 'likes') return `You like ${m.value}`;
                    break;
                }
                return null;
              }).filter(Boolean).join('. ');
              
              if (context) {
                enrichedPrompt = `Context about the user: ${context}.\n\nUser says: ${prompt}`;
              }
            }
          } catch (memoryError) {
            console.error("[WARN] Memory enrichment failed:", memoryError);
            // Continue with original prompt if memory fails
          }
        }

        const ollamaController = new AbortController();
        
        ollamaTimeout = setTimeout(() => ollamaController.abort(), 24 * 60 * 60 * 1000); // 24 hour timeout (max practical)
        
        const ollamaResponse = await fetch("http://127.0.0.1:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-oss:20b",
            messages: [{ role: "user", content: enrichedPrompt }],
          }),
          signal: ollamaController.signal,
        });
        
        if (ollamaTimeout) clearTimeout(ollamaTimeout);

        const ollamaText = await ollamaResponse.text();
        console.log("[DEBUG] Ollama response text:", ollamaText);

        const lines = ollamaText.split('\n').filter(line => line.trim().length > 0);
        const objects = [];
        for (const line of lines) {
          try {
            objects.push(JSON.parse(line));
          } catch (e) {
            console.error("[ERROR] Invalid JSON line from Ollama:", line, getErrorMessage(e));
          }
        }

        let fullResponse = "";
        for (const obj of objects) {
          if (obj?.message?.content) {
            fullResponse += obj.message.content;
          }
        }

        const data = objects.length > 0 ? { ...objects[objects.length - 1], message: { ...objects[objects.length - 1].message, content: fullResponse } } : null;
        if (!data) {
          return buildResponse({
            error: "Could not parse any JSON object from Ollama response.",
            ollamaRaw: ollamaText,
          }, 500);
        }

        console.log("[SUCCESS] /chat response received");
        return buildResponse({ result: data });

      } catch (err: unknown) {
        // Clear timeout if still pending
        if (ollamaTimeout) clearTimeout(ollamaTimeout);
        
        handleError(err);
        const errMsg = getErrorMessage(err);
        const errStack = getErrorStack(err);
        
        // Check if it's a timeout error
        if (err instanceof Error && err.name === 'AbortError') {
          console.error("[ERROR] /chat timeout: Ollama request took longer than 30 seconds");
          return buildResponse({ 
            error: "Request timeout",
            details: "The AI model took too long to respond. Please try again with a shorter prompt.",
            timeout_seconds: 30
          }, 504);
        }
        
        console.error("[ERROR] /chat failed:", errMsg, errStack);
        return buildResponse({ error: errMsg, stack: errStack }, 500);
      }
    }

    if (url.pathname === "/generate" && req.method === "POST") {
      if (!checkAuthorization(req)) {
        return buildResponse({ error: "Unauthorized" }, 401);
      }
      try {
        const bodyStream = await req.text();
        await logRequest(req, bodyStream);

        let body;
        try {
          body = JSON.parse(bodyStream);
        } catch (jsonErr: unknown) {
          const errMsg = getErrorMessage(jsonErr);
          console.error("[ERROR] JSON.parse failed:", errMsg);
          return buildResponse({
            error: "Failed to parse JSON",
            details: errMsg,
            bodyRaw: bodyStream
          }, 400);
        }

        const { prompt } = body;
        if (!prompt) {
          return buildResponse({ error: "Missing required field: prompt", received: body }, 400);
        }

        console.log(`[REQUEST] /generate with prompt: ${prompt}`);

        const ollamaResponse = await fetch("http://127.0.0.1:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-oss:20b",
            prompt,
          }),
        });

        const ollamaText = await ollamaResponse.text();
        console.log("[DEBUG] Ollama response text:", ollamaText);

        const lines = ollamaText.split('\n').filter(line => line.trim().length > 0);
        const objects = [];
        for (const line of lines) {
          try {
            objects.push(JSON.parse(line));
          } catch (e) {
            console.error("[ERROR] Invalid JSON line from Ollama:", line, getErrorMessage(e));
          }
        }

        let fullResponse = "";
        for (const obj of objects) {
          if (obj?.message?.content) {
            fullResponse += obj.message.content;
          }
        }

        const data = objects.length > 0 ? { ...objects[objects.length - 1], message: { ...objects[objects.length - 1].message, content: fullResponse } } : null;
        if (!data) {
          return buildResponse({
            error: "Could not parse any JSON object from Ollama response.",
            ollamaRaw: ollamaText,
          }, 500);
        }

        console.log("[SUCCESS] /generate response received");
        return buildResponse({ result: data });
      } catch (err: unknown) {
        handleError(err);
        const errMsg = getErrorMessage(err);
        const errStack = getErrorStack(err);
        console.error("[ERROR] /generate failed:", errMsg, errStack);
        return buildResponse({ error: errMsg, stack: errStack }, 500);
      }
    }

    if (url.pathname === "/embeddings" && req.method === "POST") {
      if (!checkAuthorization(req)) {
        return buildResponse({ error: "Unauthorized" }, 401);
      }
      try {
        const bodyStream = await req.text();
        await logRequest(req, bodyStream);

        let body;
        try {
          body = JSON.parse(bodyStream);
        } catch (jsonErr: unknown) {
          const errMsg = getErrorMessage(jsonErr);
          console.error("[ERROR] JSON.parse failed:", errMsg);
          return buildResponse({
            error: "Failed to parse JSON",
            details: errMsg,
            bodyRaw: bodyStream
          }, 400);
        }

        const { prompt } = body;
        if (!prompt) {
          return buildResponse({ error: "Missing required field: prompt", received: body }, 400);
        }

        console.log(`[REQUEST] /embeddings with prompt: ${prompt}`);

        const ollamaResponse = await fetch("http://127.0.0.1:11434/api/embeddings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-oss:20b",
            prompt,
          }),
        });

        const ollamaText = await ollamaResponse.text();
        console.log("[DEBUG] Ollama response text:", ollamaText);

        const lines = ollamaText.split('\n').filter(line => line.trim().length > 0);
        const objects = [];
        for (const line of lines) {
          try {
            objects.push(JSON.parse(line));
          } catch (e) {
            console.error("[ERROR] Invalid JSON line from Ollama:", line, getErrorMessage(e));
          }
        }

        let fullResponse = "";
        for (const obj of objects) {
          if (obj?.message?.content) {
            fullResponse += obj.message.content;
          }
        }

        const data = objects.length > 0 ? { ...objects[objects.length - 1], message: { ...objects[objects.length - 1].message, content: fullResponse } } : null;
        if (!data) {
          return buildResponse({
            error: "Could not parse any JSON object from Ollama response.",
            ollamaRaw: ollamaText,
          }, 500);
        }

        console.log("[SUCCESS] /embeddings response received");
        return buildResponse({ result: data });
      } catch (err: unknown) {
        handleError(err);
        const errMsg = getErrorMessage(err);
        const errStack = getErrorStack(err);
        console.error("[ERROR] /embeddings failed:", errMsg, errStack);
        return buildResponse({ error: errMsg, stack: errStack }, 500);
      }
    }

    if (url.pathname === "/memory/save" && req.method === "POST") {
      if (!checkAuthorization(req)) {
        return buildResponse({ error: "Unauthorized" }, 401);
      }
      
      if (!mongoHandlerConnected) {
        return buildResponse({ 
          error: "MongoDB Handler not available", 
          details: "Memory saving requires MongoDB connection. Please check server logs for connection details.",
          mongodb_uri_configured: process.env.MONGO_URI ? true : false,
          fallback: "Server is running in degraded mode without memory functionality"
        }, 503);
      }
      
      try {
        const bodyStream = await req.text();
        await logRequest(req, bodyStream);

        let body;
        try {
          body = JSON.parse(bodyStream);
        } catch (jsonErr: unknown) {
          const errMsg = getErrorMessage(jsonErr);
          console.error("[ERROR] JSON.parse failed:", errMsg);
          return buildResponse({
            error: "Failed to parse JSON",
            details: errMsg,
            bodyRaw: bodyStream
          }, 400);
        }

        const { userId, sentence } = body;
        if (!userId || !sentence) {
          return buildResponse({ error: "Missing required fields: userId, sentence", received: body }, 400);
        }

        await mongoHandler.saveMemory(userId, sentence);
        console.log(`[INFO] Memory saved for user ${userId}`);
        return buildResponse({ success: true });
        
      } catch (err: unknown) {
        handleError(err);
        const errMsg = getErrorMessage(err);
        const errStack = getErrorStack(err);
        console.error("[ERROR] /memory/save failed:", errMsg, errStack);
        return buildResponse({ error: errMsg, stack: errStack }, 500);
      }
    }

    if (url.pathname === "/memory/get" && req.method === "POST") {
      if (!checkAuthorization(req)) {
        return buildResponse({ error: "Unauthorized" }, 401);
      }
      
      if (!mongoHandlerConnected) {
        return buildResponse({ 
          error: "MongoDB Handler not available",
          details: "Memory retrieval requires MongoDB connection. Please check server logs for connection details.",
          mongodb_uri_configured: process.env.MONGO_URI ? true : false,
          fallback: "Server is running in degraded mode without memory functionality"
        }, 503);
      }
      
      try {
        const bodyStream = await req.text();
        await logRequest(req, bodyStream);

        let body;
        try {
          body = JSON.parse(bodyStream);
        } catch (jsonErr: unknown) {
          const errMsg = getErrorMessage(jsonErr);
          console.error("[ERROR] JSON.parse failed:", errMsg);
          return buildResponse({
            error: "Failed to parse JSON",
            details: errMsg,
            bodyRaw: bodyStream
          }, 400);
        }

        const { userId, prompt } = body;
        if (!userId || !prompt) {
          return buildResponse({ error: "Missing required fields: userId, prompt", received: body }, 400);
        }

        const memories = await mongoHandler.getRelevantMemory(userId, prompt);
        console.log(`[INFO] Retrieved ${memories.length} memories for user ${userId}`);
        return buildResponse({ memories });
        
      } catch (err: unknown) {
        handleError(err);
        const errMsg = getErrorMessage(err);
        const errStack = getErrorStack(err);
        console.error("[ERROR] /memory/get failed:", errMsg, errStack);
        return buildResponse({ error: errMsg, stack: errStack }, 500);
      }
    }

    if (url.pathname === "/feedback" && req.method === "POST") {
      if (!checkAuthorization(req)) {
        return buildResponse({ error: "Unauthorized" }, 401);
      }
      try {
        const bodyStream = await req.text();
        await logRequest(req, bodyStream);

        let body;
        try {
          body = JSON.parse(bodyStream);
        } catch (jsonErr: unknown) {
          const errMsg = getErrorMessage(jsonErr);
          console.error("[ERROR] JSON.parse failed:", errMsg);
          return buildResponse({
            error: "Failed to parse JSON",
            details: errMsg,
            bodyRaw: bodyStream
          }, 400);
        }
        const { prompt, response, feedback, ideal } = body;

        if (!prompt || !response || !feedback) {
          return buildResponse({ error: "Missing fields", received: body }, 400);
        }

        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017");
        await client.connect();
        const db = client.db("roommate");
        await db.collection("feedbacks").insertOne({
          prompt,
          response,
          feedback,
          ideal,
          createdAt: new Date(),
        });
        await client.close();

        console.log("[INFO] Feedback saved");
        return buildResponse({ success: true });
      } catch (err: unknown) {
        handleError(err);
        const errMsg = getErrorMessage(err);
        const errStack = getErrorStack(err);
        console.error("[ERROR] /feedback failed:", errMsg, errStack);
        return buildResponse({ error: errMsg, stack: errStack }, 500);
      }
    }

    console.warn("[WARN] Route not found:", url.pathname);
    return buildResponse({ error: "Route not found" }, 404);
  },
});

console.log(`Roommate server online!`);

// Initialize MongoDB Handler
initMongoDB().catch(console.error);

// Retry MongoDB connection every 60 seconds if not connected (except during tests)
let mongoRetryInterval: any;
if (process.env.NODE_ENV !== 'test') {
  mongoRetryInterval = setInterval(async () => {
    if (!mongoHandlerConnected) {
      console.log("[INFO] MongoDB not connected, attempting to reconnect...");
      await initMongoDB();
    }
  }, 60000); // 60 seconds
}

// Export functions for testing
export { sendNightwatch, initMongoDB, handleError, checkAuthorization, corsHeaders, mongoRetryInterval };
