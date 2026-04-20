#!/bin/bash
set -e

# Smoke test for sme-mart-login stack
# Tests: Login page loads
#
# F-NEW-1 fix: Honors PORT env var override

PORT="${PORT:-15002}"

echo "Testing sme-mart-login (port $PORT)..."

# Test: Login page loads
echo "  [1/1] Checking /login/..."
RESPONSE=$(curl -s "http://localhost:${PORT}/login/")
if ! echo "$RESPONSE" | grep -qi '<html>'; then
  echo "    FAILED /login/ did not return HTML"
  exit 1
fi
echo "    OK /login/ returns login page"

echo "OK sme-mart-login smoke tests PASSED"
exit 0
