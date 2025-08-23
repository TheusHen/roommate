import json
import datasets
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model
import torch
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from sentry.py.sentry import capture_error, capture_message
import requests

MODEL_ID = "openai-community/gpt-oss-20b"
OUTPUT_DIR = "lora-output"

analytics_option = "None (not recommended)"
config_path = os.path.join(os.path.dirname(__file__), "../config/analytics_config.json")
if os.path.exists(config_path):
    try:
        with open(config_path, "r") as f:
            config = json.load(f)
            analytics_option = config.get("analytics", analytics_option)
    except Exception as e:
        print("[WARN] Failed to load analytics_config.json:", e)

def send_nightwatch(error):
    api_url = os.environ.get("NIGHTWATCH_API_URL")
    api_key = os.environ.get("NIGHTWATCH_API_KEY")
    if not api_url or not api_key:
        return
    try:
        requests.post(api_url, json={"error": str(error)}, headers={"Authorization": f"Bearer {api_key}"})
    except Exception as e:
        print("[WARN] Failed to send error to Nightwatch:", e)

def handle_error(error):
    if analytics_option == "Sentry":
        capture_error(error)
    elif analytics_option == "Nightwatch":
        send_nightwatch(error)
    elif analytics_option == "Both":
        capture_error(error)
        send_nightwatch(error)

try:
    print("[INFO] Loading feedback dataset...")
    data = datasets.load_dataset("json", data_files="../scheduled/feedback.jsonl")["train"]
except Exception as e:
    handle_error(e)
    print("[ERROR] Failed to load dataset:", e)
    sys.exit(1)

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
except Exception as e:
    handle_error(e)
    print("[ERROR] Failed to load tokenizer:", e)
    sys.exit(1)

def format_example(example):
    if "ideal" in example and example["ideal"]:
        return {
            "input_ids": tokenizer(
                example["prompt"], truncation=True, padding="max_length", max_length=512
            ).input_ids,
            "labels": tokenizer(
                example["ideal"], truncation=True, padding="max_length", max_length=512
            ).input_ids,
        }
    else:
        return None

try:
    data = data.map(format_example, remove_columns=data.column_names)
    data = data.filter(lambda x: x is not None)
except Exception as e:
    handle_error(e)
    print("[ERROR] Failed to prepare data:", e)
    sys.exit(1)

print(f"[INFO] {len(data)} examples prepared for training.")

try:
    print("[INFO] Loading base model...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        load_in_8bit=True,
        device_map="auto"
    )
except Exception as e:
    handle_error(e)
    print("[ERROR] Failed to load base model:", e)
    sys.exit(1)

lora_config = LoraConfig(
    r=8,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

try:
    model = get_peft_model(model, lora_config)
except Exception as e:
    handle_error(e)
    print("[ERROR] Failed to apply LoRA:", e)
    sys.exit(1)

training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=4,
    num_train_epochs=1,
    learning_rate=2e-4,
    logging_dir="./logs",
    save_strategy="epoch"
)

try:
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=data
    )
except Exception as e:
    handle_error(e)
    print("[ERROR] Failed to initialize Trainer:", e)
    sys.exit(1)

try:
    print("[INFO] Starting LoRA fine-tuning...")
    trainer.train()
except Exception as e:
    handle_error(e)
    print("[ERROR] Training failed:", e)
    sys.exit(1)

try:
    print("[INFO] Saving fine-tuned weights...")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
except Exception as e:
    handle_error(e)
    print("[ERROR] Failed to save weights:", e)
    sys.exit(1)

print("[SUCCESS] Fine-tuning completed. Weights saved in", OUTPUT_DIR)