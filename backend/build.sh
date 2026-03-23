#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npx tsc

# Install Chrome for Puppeteer
echo "Installing Chrome for Puppeteer..."
npx puppeteer browsers install chrome

# Ensure the cache directory exists and is linked if needed
# (Optional, but helps with discovery)
mkdir -p /opt/render/.cache/puppeteer
