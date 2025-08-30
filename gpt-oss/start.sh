#!/bin/bash

# Check if ollama is installed first
if ! command -v ollama &> /dev/null; then
  echo "Ollama not found. Installing..."
  curl -fsSL https://ollama.com/install.sh | sh
fi

# Verify ollama is working
ollama -v

# Check if gpt-oss models are already running
if ollama list | grep -E 'gpt-oss:20b-highreasoning|gpt-oss:20b-lora' | grep -q 'Running'; then
  echo "gpt-oss:20b-highreasoning or gpt-oss:20b-lora is already running. Skipping startup."
  exit 0
fi

MIN_GB=14
./scripts/check_space.sh $MIN_GB
if [ $? -ne 0 ]; then
    echo "Aborting: Not enough disk space for gpt-oss:20b (requires ${MIN_GB}GB)."
    exit 1
fi

# Start Ollama server if not running
if ! pgrep -f "ollama serve" > /dev/null; then
  nohup ollama serve > ollama-server.log 2>&1 &
  sleep 2
fi

# gpt-oss:20b Size: 14GB Context: 128K
ollama pull gpt-oss:20b

# Create high reasoning model if it does not exist
if ! ollama list | grep -q "gpt-oss:20b-highreasoning"; then
  cat > gpt-oss-highreasoning.modelfile <<EOF
FROM gpt-oss:20b

PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.05
PARAMETER num_ctx 128000

SYSTEM """
You're a model of advanced reasoning.
Always develop your thinking step by step before responding.
"""
EOF

  ollama create gpt-oss:20b-highreasoning -f gpt-oss-highreasoning.modelfile
fi

TUNING_FILE="tuning_count.txt"
if [ ! -f "$TUNING_FILE" ]; then
  echo "0" > "$TUNING_FILE"
fi

COUNT=$(cat "$TUNING_FILE")

if [ "$COUNT" -ge 1 ]; then
  nohup ollama run gpt-oss:20b-lora > output.log 2>&1 &
else
  nohup ollama run gpt-oss:20b-highreasoning > output.log 2>&1 &
fi

echo $! > ollama.pid
