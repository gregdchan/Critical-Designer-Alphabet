#!/bin/bash
set -e

# Ensure we are running from the repository root
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR/designeralphabet"

npm install
npm run build
npm run preview -- --host 0.0.0.0 --port "${PORT:-4173}"
