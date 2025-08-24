#!/bin/bash

set -e

PYTHON_VERSION="3.10.16"
PYTHON_TAR="Python-${PYTHON_VERSION}.tar.xz"
PYTHON_SRC_DIR="Python-${PYTHON_VERSION}"
PYTHON_URL="https://www.python.org/ftp/python/${PYTHON_VERSION}/${PYTHON_TAR}"

sudo apt update
sudo apt install -y build-essential libssl-dev zlib1g-dev libncurses5-dev \
    libncursesw5-dev libreadline-dev libsqlite3-dev libgdbm-dev libdb5.3-dev \
    libbz2-dev libexpat1-dev liblzma-dev tk-dev libffi-dev wget

wget -O "${PYTHON_TAR}" "${PYTHON_URL}"

tar -xf "${PYTHON_TAR}"

cd "${PYTHON_SRC_DIR}"

./configure --enable-optimizations
make -j$(nproc)

sudo make altinstall

python3 --version