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

// Load or generate and save the API password (never changes)
if (fs.existsSync(passwordFilePath)) {
  apiPassword = fs.readFileSync(passwordFilePath, "utf8").trim();
} else {
  apiPassword = generatePassword(16); // 32 hex chars
  fs.writeFileSync(passwordFilePath, apiPassword, "utf8");
  console.log(`[INFO] Generated API password: ${apiPassword}`);
}

// Always show the password on server start
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

// Authorization helper
function checkAuthorization(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${apiPassword}`) {
    return false;
  }
  return true;
}

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const startTime = Date.now();

    const country = Intl.DateTimeFormat().resolvedOptions().locale || "Unknown";

    async function buildResponse(data: any, status = 200) {
      const elapsed = Date.now() - startTime;
      return new Response(
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
    }

    if (url.pathname === "/") {
      console.log("[INFO] Root route called");
      return buildResponse({ message: "Roommate: Using Ollama GPT-OSS:20B" });
    }

    // Health check
    if (url.pathname === "/ping") {
      console.log("[INFO] /ping route called");
      return buildResponse({ message: "pong" });
    }

    // --- Chat endpoint ---
    if (url.pathname === "/chat" && req.method === "POST") {
      if (!checkAuthorization(req)) {
        return buildResponse({ error: "Unauthorized" }, 401);
      }
      try {
        const body = await req.json();
        const { prompt } = body as { prompt?: string };
        if (!prompt) {
          return buildResponse({ error: "Missing required field: prompt" }, 400);
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

        const data = await ollamaResponse.json();
        console.log("[SUCCESS] /chat response received");

        return buildResponse({ result: data });
      } catch (err: any) {
        handleError(err);
        console.error("[ERROR] /chat failed:", err.message);
        return buildResponse({ error: err.message }, 500);
      }
    }

    // --- Generate endpoint ---
    if (url.pathname === "/generate" && req.method === "POST") {
      if (!checkAuthorization(req)) {
        return buildResponse({ error: "Unauthorized" }, 401);
      }
      try {
        const body = await req.json();
        const { prompt } = body as { prompt?: string };
        if (!prompt) {
          return buildResponse({ error: "Missing required field: prompt" }, 400);
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

        const data = await ollamaResponse.json();
        console.log("[SUCCESS] /generate response received");

        return buildResponse({ result: data });
      } catch (err: any) {
        handleError(err);
        console.error("[ERROR] /generate failed:", err.message);
        return buildResponse({ error: err.message }, 500);
      }
    }

    // --- Embeddings endpoint ---
    if (url.pathname === "/embeddings" && req.method === "POST") {
      if (!checkAuthorization(req)) {
        return buildResponse({ error: "Unauthorized" }, 401);
      }
      try {
        const body = await req.json();
        const { prompt } = body as { prompt?: string };
        if (!prompt) {
          return buildResponse({ error: "Missing required field: prompt" }, 400);
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

        const data = await ollamaResponse.json();
        console.log("[SUCCESS] /embeddings response received");

        return buildResponse({ result: data });
      } catch (err: any) {
        handleError(err);
        console.error("[ERROR] /embeddings failed:", err.message);
        return buildResponse({ error: err.message }, 500);
      }
    }

    // Not found
    console.warn("[WARN] Route not found:", url.pathname);
    return buildResponse({ error: "Route not found" }, 404);
  },
});

console.log(`Roommate server online!`);