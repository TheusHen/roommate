import dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";
import { execSync } from "child_process";
import fs from "fs";

const client = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017");

async function main() {
  await client.connect();
  const db = client.db("roommate");
  const feedbacks = await db.collection("feedbacks").find({}).toArray();

  if (feedbacks.length >= 50) {
    console.log(`[INFO] ${feedbacks.length} feedbacks found, starting fine-tuning...`);

    const jsonl = feedbacks.map(f =>
      JSON.stringify({
        prompt: f.prompt,
        response: f.response,
        feedback: f.feedback,
        ideal: f.ideal
      })
    ).join("\n");
    fs.writeFileSync("../fine-tuning/feedback.jsonl", jsonl);

    const pid = fs.readFileSync("ollama.pid", "utf8").trim();
    execSync(`kill ${pid}`);
    console.log("[INFO] Ollama stopped.");

    execSync("python3 ../fine-tuning/fine.py");

    execSync("ollama create gpt-oss-20b-lora -f ../fine-tuning/lora-output");
    console.log("[INFO] New model created.");

    let count = 0;
    if (fs.existsSync("tuning_count.txt")) {
      count = parseInt(fs.readFileSync("tuning_count.txt", "utf8"));
    }
    count++;
    fs.writeFileSync("tuning_count.txt", count.toString());

    await db.collection("feedbacks").deleteMany({});
    console.log("[INFO] Feedbacks cleared.");

    const out = execSync("nohup ollama run gpt-oss-20b-lora > output.log 2>&1 & echo $!");
    fs.writeFileSync("ollama.pid", out.toString().trim());
    console.log("[INFO] Ollama restarted.");
  }

  await client.close();
}

main().catch(err => {
  console.error("[ERROR] Scheduler failed:", err.message);
});
