#!/usr/bin/env bash
set -euo pipefail

PACKAGE_MANAGER="${1:-npm}"
SKIP_BROWSER_INSTALL="${SKIP_BROWSER_INSTALL:-false}"

if [[ "$PACKAGE_MANAGER" != "npm" && "$PACKAGE_MANAGER" != "bun" ]]; then
  echo "Usage: ./scripts/setup-playwright.sh [npm|bun]" >&2
  exit 1
fi

mkdir -p e2e/pages e2e/specs e2e/support scripts

if [[ "$PACKAGE_MANAGER" == "bun" ]]; then
  INSTALL_COMMAND="bun add -d @playwright/test"
  BROWSER_COMMAND="bunx playwright install chromium"
else
  INSTALL_COMMAND="npm install -D @playwright/test"
  BROWSER_COMMAND="npx playwright install chromium"
fi

echo "Exact install commands:"
echo "  $INSTALL_COMMAND"
if [[ "$SKIP_BROWSER_INSTALL" != "true" ]]; then
  echo "  $BROWSER_COMMAND"
fi
echo

eval "$INSTALL_COMMAND"

if [[ "$SKIP_BROWSER_INSTALL" != "true" ]]; then
  eval "$BROWSER_COMMAND"
fi

echo
echo "Recommended run commands:"
echo "  npm run e2e"
echo "  npm run e2e:headed"
