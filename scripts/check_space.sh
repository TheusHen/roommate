#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <min_GB>"
    exit 1
fi

MIN_GB="$1"

FREE_SPACE=$(df -BG / | awk 'NR==2 {gsub("G","",$4); print $4}')

if [ "$FREE_SPACE" -ge "$MIN_GB" ]; then
    echo "OK: Sufficient free space ($FREE_SPACE GB >= $MIN_GB GB)"
    exit 0
else
    echo "ERROR: Insufficient free space ($FREE_SPACE GB < $MIN_GB GB)"
    exit 2
fi