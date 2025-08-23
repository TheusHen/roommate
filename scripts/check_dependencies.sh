#!/bin/bash

if ! command -v python3 &> /dev/null; then
    echo "Python not found. Installing..."
    /install/python.sh
else
    echo "Python already installed: $(python3 --version)"
fi

if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing..."
    /install/node.sh
else
    echo "Node.js already installed: $(node -v)"
fi

if ! command -v php &> /dev/null; then
    echo "PHP not found. Installing..."
    /install/php.sh
else
    echo "PHP already installed: $(php -v | head -n 1)"
fi