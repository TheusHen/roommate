#!/bin/bash

MIN_GB=14
./scripts/check_space.sh $MIN_GB
if [ $? -ne 0 ]; then
    echo "Aborting: Not enough disk space for gpt-oss:20b (requires ${MIN_GB}GB)."
    exit 1
fi

if ! command -v ollama &> /dev/null; then
  curl -fsSL https://ollama.com/install.sh | sh
fi

ollama -v

# Start Ollama server if not running
if ! pgrep -f "ollama serve" > /dev/null; then
  nohup ollama serve > ollama-server.log 2>&1 &
  sleep 2
fi

# gpt-oss:20b Size: 14GB Context: 128K
ollama pull gpt-oss:20b

TURING_FILE="turing_count.txt"
if [ ! -f "$TURING_FILE" ]; then
  echo "0" > "$TURING_FILE"
fi

COUNT=$(cat "$TURING_FILE")

if [ "$COUNT" -ge 1 ]; then
  nohup ollama run gpt-oss-20b-lora > output.log 2>&1 &
else
  nohup ollama run gpt-oss:20b > output.log 2>&1 &
fi

echo $! > ollama.pid