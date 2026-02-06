#!/usr/bin/env bash
# Publish to npm when 2FA is enabled. Asks for your one-time code.
# Run from repo root: ./scripts/npm-publish-with-otp.sh
# The code must come from YOUR authenticator app (e.g. Authy, Google Authenticator) - not the example "123456".

set -e
cd "$(dirname "$0")/.."

echo "Checking npm login..."
npm whoami || { echo "Run 'npm login' first."; exit 1; }

echo ""
echo "Open your authenticator app and get the current 6-digit code for npm."
echo "Enter it below (the code changes every ~30 seconds)."
echo ""
read -r -p "OTP code: " OTP

if [ -z "$OTP" ]; then
  echo "No code entered. Exiting."
  exit 1
fi

echo "Publishing with OTP..."
npm publish --otp="$OTP"

echo "Done."
