#!/bin/bash
set -e

# Master smoke test script for Phase 19 stacks
# Runs all per-stack health checks and reports aggregate status
# Usage: bash smoke-all.sh [cloudfront-sim|sme-mart-spa|sme-mart-login] (optional: specific stack)
#
# F-NEW-1 fix: Honors CLOUDFRONT_SIM_PORT override for smoke test port

PORT="${CLOUDFRONT_SIM_PORT:-15002}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "[${TIMESTAMP}] Phase 19 Smoke Tests — Starting"
echo "=========================================="
echo "Using port: $PORT (from CLOUDFRONT_SIM_PORT=${CLOUDFRONT_SIM_PORT:-default})"

STACKS_TO_TEST=("cloudfront-sim" "sme-mart-spa" "sme-mart-login")

if [[ -n "${1:-}" ]]; then
  STACKS_TO_TEST=("$1")
fi

FAILED=()
PASSED=()

for STACK in "${STACKS_TO_TEST[@]}"; do
  SMOKE_SCRIPT="${SCRIPT_DIR}/${STACK}/smoke.sh"

  if [[ ! -f "$SMOKE_SCRIPT" ]]; then
    echo "FAILED: ${STACK} (smoke.sh not found at $SMOKE_SCRIPT)"
    FAILED+=("${STACK}")
    continue
  fi

  echo ""
  echo ">>> Testing: ${STACK}"

  # Pass PORT env var to smoke script
  if PORT="$PORT" bash "$SMOKE_SCRIPT"; then
    echo "PASSED: ${STACK}"
    PASSED+=("${STACK}")
  else
    echo "FAILED: ${STACK} (see output above)"
    FAILED+=("${STACK}")
  fi
done

# Summary
echo ""
echo "=========================================="
echo "[${TIMESTAMP}] Smoke Test Summary"
echo "=========================================="

if [[ ${#PASSED[@]} -gt 0 ]]; then
  echo "PASSED (${#PASSED[@]}):"
  for s in "${PASSED[@]}"; do
    echo "  OK ${s}"
  done
fi

if [[ ${#FAILED[@]} -gt 0 ]]; then
  echo ""
  echo "FAILED (${#FAILED[@]}):"
  for s in "${FAILED[@]}"; do
    echo "  FAILED ${s}"
  done
  echo ""
  echo "Run 'docker logs <container>' for more details."
  exit 1
fi

echo ""
echo "OK All smoke tests PASSED"
exit 0
