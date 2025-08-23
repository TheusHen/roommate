import json
import datasets
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model
import torch

# TODO: Implement error tracking

MODEL_ID = "openai-community/gpt-oss-20b"
OUTPUT_DIR = "lora-output"

print("[INFO] Loading feedback dataset...")

data = datasets.load_dataset("json", data_files="../scheduled/feedback.jsonl")["train"]

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)

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

data = data.map(format_example, remove_columns=data.column_names)
data = data.filter(lambda x: x is not None)

print(f"[INFO] {len(data)} examples prepared for training.")

# Load base model
print("[INFO] Loading base model...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    load_in_8bit=True,
    device_map="auto"
)

# LoRA configuration
lora_config = LoraConfig(
    r=8,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

model = get_peft_model(model, lora_config)

training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=4,
    num_train_epochs=1,
    learning_rate=2e-4,
    logging_dir="./logs",
    save_strategy="epoch"
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=data
)

print("[INFO] Starting LoRA fine-tuning...")
trainer.train()

print("[INFO] Saving fine-tuned weights...")
model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print("[SUCCESS] Fine-tuning completed. Weights saved in", OUTPUT_DIR)