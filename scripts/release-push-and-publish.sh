#!/usr/bin/env bash
# Run from repo root: ./scripts/release-push-and-publish.sh
# Requires: git push access to origin, npm login.
# If npm has 2FA: pass your one-time code: NPM_OTP=123456 ./scripts/release-push-and-publish.sh

set -e
cd "$(dirname "$0")/.."

echo "Step 1: Pushing to GitHub..."
git push origin main

echo "Step 2: Publishing to npm..."
if [ -n "$NPM_OTP" ]; then
  npm publish --otp="$NPM_OTP"
else
  echo "Tip: If you get 403 (2FA required), run: NPM_OTP=<code> $0"
  npm publish
fi

echo "Step 3: Pushing tag v6.0.22 (if not already pushed)..."
git tag v6.0.22 2>/dev/null || true
git push origin v6.0.22 2>/dev/null || true

echo "Done. npm page will show correct repo after a short delay."
