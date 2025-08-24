import { captureError } from "../sentry/ts/sentry";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function withCorsHeaders(resp: Response) {
  const headers = new Headers(resp.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
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

    if (url.pathname === "/chat" && req.method === "POST") {
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

        console.log(`[REQUEST] /chat with prompt: ${prompt}`);

        const ollamaResponse = await fetch("http://127.0.0.1:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-oss:20b",
            messages: [{ role: "user", content: prompt }],
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

        console.log("[SUCCESS] /chat response received");
        return buildResponse({ result: data });

      } catch (err: unknown) {
        handleError(err);
        const errMsg = getErrorMessage(err);
        const errStack = getErrorStack(err);
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