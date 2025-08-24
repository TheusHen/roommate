#!/bin/bash

curl -o- https://fnm.vercel.app/install | bash
fnm install 22
node -v
npm -v