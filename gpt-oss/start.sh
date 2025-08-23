#!/bin/bash

MIN_GB=14
./scripts/check_space.sh $MIN_GB
if [ $? -ne 0 ]; then
    echo "Aborting: Not enough disk space for gpt-oss:20b (requires ${MIN_GB}GB)."
    exit 1
fi

curl -fsSL https://ollama.com/install.sh | sh
ollama -v

# gpt-oss:20b Size: 14GB Context: 128K
ollama pull gpt-oss:20b
nohup ollama run gpt-oss:20b > output.log 2>&1 &