#!/bin/bash
set -e

# Smoke test for cloudfront-sim stack
# Checks: containers running, nginx responding, ports accessible
#
# F-NEW-1 fix: Honors PORT env var override

PORT="${PORT:-15002}"

echo "Testing cloudfront-sim (port $PORT)..."

# Test 1: Containers are running
echo "  [1/2] Checking containers..."
if ! docker ps | grep -q cloudfront-sim-nginx; then
  echo "    FAILED cloudfront-sim-nginx container not running"
  exit 1
fi
echo "    OK cloudfront-sim-nginx running"

# Test 2: nginx responds to requests
echo "  [2/2] Checking nginx endpoint..."
if ! curl -sf "http://localhost:${PORT}/" > /dev/null 2>&1; then
  echo "    FAILED nginx not responding on http://localhost:${PORT}"
  exit 1
fi
echo "    OK nginx responding on port $PORT"

echo "OK cloudfront-sim smoke tests PASSED"
exit 0
