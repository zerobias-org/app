#!/bin/bash
set -e

# Smoke test for sme-mart-spa stack
# Tests: SPA index, deep-route fallback
#
# F-NEW-1 fix: Honors PORT env var override

PORT="${PORT:-15002}"

echo "Testing sme-mart-spa (port $PORT)..."

# Test 1: SPA index loads
echo "  [1/2] Checking /sme-mart/..."
RESPONSE=$(curl -s "http://localhost:${PORT}/sme-mart/")
if ! echo "$RESPONSE" | grep -q '<html>'; then
  echo "    FAILED /sme-mart/ did not return HTML"
  exit 1
fi
echo "    OK /sme-mart/ returns index.html"

# Test 2: Deep-route fallback (LS-01: 404 -> index.html)
echo "  [2/2] Checking deep-route fallback..."
RESPONSE=$(curl -s "http://localhost:${PORT}/sme-mart/rfps/test-route")
if ! echo "$RESPONSE" | grep -q '<html>'; then
  echo "    FAILED /sme-mart/rfps/test-route did not return index.html (fallback failed)"
  exit 1
fi
echo "    OK /sme-mart/rfps/test-route returns index.html (fallback working)"

echo "OK sme-mart-spa smoke tests PASSED"
exit 0
