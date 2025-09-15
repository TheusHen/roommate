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

// IP tracking for test mode
const testModeUsage = new Map<string, { count: number; firstRequest: number }>();
const TEST_MODE_LIMIT = 3;
const TEST_MODE_TOKEN = 'TEST_MODE';

// Clean up old entries periodically (24 hours)
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function cleanupOldTestModeEntries() {
  const now = Date.now();
  for (const [ip, usage] of testModeUsage.entries()) {
    if (now - usage.firstRequest > CLEANUP_INTERVAL) {
      testModeUsage.delete(ip);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupOldTestModeEntries, 60 * 60 * 1000);

function getClientIP(req: Request): string {
  // Try to get IP from various headers (considering proxies)
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const xRealIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  
  if (xRealIP) {
    return xRealIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback - this might not work correctly behind proxies
  return 'unknown';
}

function checkTestModeLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const usage = testModeUsage.get(ip);
  
  if (!usage) {
    // First request from this IP
    testModeUsage.set(ip, { count: 1, firstRequest: now });
    return { allowed: true, remaining: TEST_MODE_LIMIT - 1 };
  }
  
  if (usage.count >= TEST_MODE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  // Increment counter
  usage.count++;
  testModeUsage.set(ip, usage);
  
  return { allowed: true, remaining: TEST_MODE_LIMIT - usage.count };
}

function checkAuthorization(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { authorized: false, isTestMode: false };
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  if (token === TEST_MODE_TOKEN) {
    return { authorized: true, isTestMode: true };
  }
  
  if (token === apiPassword) {
    return { authorized: true, isTestMode: false };
  }
  
  return { authorized: false, isTestMode: false };
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
      const authResult = checkAuthorization(req);
      
      if (!authResult.authorized) {
        return buildResponse({ error: "Unauthorized" }, 401);
      }
      
      // Check test mode limits if using test token
      let remainingRequests: number | undefined;
      if (authResult.isTestMode) {
        const clientIP = getClientIP(req);
        const limitCheck = checkTestModeLimit(clientIP);
        
        if (!limitCheck.allowed) {
          return buildResponse({ 
            error: "Test mode limit reached",
            message: "You've used all 3 free test messages. To continue using Roommate, please set up your own server.",
            repository_url: "https://github.com/TheusHen/roommate",
            setup_instructions: "Clone the repository and follow the setup instructions in the README to run your own Roommate server.",
            ip: clientIP
          }, 429);
        }
        
        remainingRequests = limitCheck.remaining;
        console.log(`[INFO] Test mode request from IP ${clientIP}, ${remainingRequests} requests remaining`);
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
        
        // Prepare the system prompt and user message
        const systemPrompt = `You are Roommate, a personal assistant and study companion who acts like a helpful roommate.
Your role is to maintain natural, warm conversations while providing academic support and helping with various tasks, including calculations, explanations, and study assistance.

Main behavior rules:
1. Always reply in a clear, friendly, and engaging way, like a close friend who's also academically knowledgeable.
2. Automatically adapt to the user's language (if they write in Portuguese, answer in Portuguese; if they switch to English, continue in English).
3. Perform mathematical calculations when requested, showing your work and explaining the steps.
4. Provide comprehensive academic explanations for any subject with examples when helpful.
5. Format responses using Markdown for readability and structure when appropriate.
6. When using LaTeX formulas, first provide the complete explanation in plain text, then include the LaTeX formulas separately below, wrapped in <latex> tags.
7. If the user writes something like "Said: <message>", interpret that as the main input and respond directly.
8. Maintain continuity by remembering the previous context whenever possible.
9. Don't limit yourself - act as a true study partner who can help with any academic or practical question.`;

        const ollamaResponse = await fetch("http://127.0.0.1:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-oss:20b",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: enrichedPrompt }
            ],
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
        const responseData: any = { result: data };
        
        // Add test mode information if applicable
        if (authResult.isTestMode && remainingRequests !== undefined) {
          responseData.test_mode = {
            active: true,
            remaining_requests: remainingRequests,
            message: remainingRequests > 0 
              ? `You have ${remainingRequests} test messages remaining.`
              : "This was your last test message. Set up your own server to continue!"
          };
        }
        
        return buildResponse(responseData);

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
      const authResult = checkAuthorization(req);
      if (!authResult.authorized) {
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
      const authResult = checkAuthorization(req);
      if (!authResult.authorized) {
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
      const authResult = checkAuthorization(req);
      if (!authResult.authorized) {
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
      const authResult = checkAuthorization(req);
      if (!authResult.authorized) {
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
      const authResult = checkAuthorization(req);
      if (!authResult.authorized) {
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
