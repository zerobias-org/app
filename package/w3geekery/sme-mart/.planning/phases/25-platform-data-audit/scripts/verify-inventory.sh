#!/bin/bash

# Verification script for Phase 25 Platform Data Audit
# Checks Wave 0 artifact completeness
# Exit 0 on success, non-zero on any failure
# Idempotent — safe to run multiple times

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
DIRECTOR_DIR="$PROJECT_ROOT/.planning/director"
INVENTORY_DIR="$DIRECTOR_DIR/platform-data-inventory"
INDEX_FILE="$DIRECTOR_DIR/PLATFORM-DATA-INVENTORY.md"
TEMPLATE_FILE="$INVENTORY_DIR/_TEMPLATE.md"

FAILED=0

# Check 1: Index file exists
if [ ! -f "$INDEX_FILE" ]; then
    echo "ERROR: Index file not found: $INDEX_FILE"
    FAILED=1
else
    echo "✓ Index file exists: $INDEX_FILE"
fi

# Check 2: Directory exists
if [ ! -d "$INVENTORY_DIR" ]; then
    echo "ERROR: Directory not found: $INVENTORY_DIR"
    FAILED=1
else
    echo "✓ Directory exists: $INVENTORY_DIR"
fi

# Check 3: Template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "ERROR: Template file not found: $TEMPLATE_FILE"
    FAILED=1
else
    echo "✓ Template file exists: $TEMPLATE_FILE"
fi

# Check 4: Count markdown files (excluding _TEMPLATE.md)
SOURCE_COUNT=$(find "$INVENTORY_DIR" -maxdepth 1 -name "*.md" ! -name "_TEMPLATE.md" -type f | wc -l)
echo "✓ Source sub-files count: $SOURCE_COUNT (≥ 0 OK for Wave 1)"

# Check 5: Verify index file contains required section headers
for SECTION in "## Platform Data Inventory" "## Pre-fill Map" "## Known Unknowns" "## Pipeline Health Check"; do
    if grep -q "$SECTION" "$INDEX_FILE"; then
        echo "✓ Found section header: $SECTION"
    else
        echo "ERROR: Missing section header: $SECTION"
        FAILED=1
    fi
done

# Exit with status
if [ $FAILED -eq 0 ]; then
    echo ""
    echo "All Wave 0 checks passed ✓"
    exit 0
else
    echo ""
    echo "Verification FAILED"
    exit 1
fi
