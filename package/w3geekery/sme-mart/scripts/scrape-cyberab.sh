#!/usr/bin/env bash
set -euo pipefail

# Scrape cyberab.org into a local mirror for CMMC role/certification catalog
# extraction. Output lands in /tmp/cyberab-mirror/ (gitignored via /tmp).
#
# Usage: ./scripts/scrape-cyberab.sh [output-dir]
#
# Re-run whenever cyberab publishes new roles/certs. Diff the new output
# against the committed catalog in .claude/proposals/ to find additions.

OUT_DIR="${1:-/tmp/cyberab-mirror}"
HOST="cyberab.org"

mkdir -p "$OUT_DIR"

echo "Scraping https://${HOST} -> ${OUT_DIR}"
echo "Start: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# --mirror         recursion + timestamps
# --domains        stay on cyberab.org
# --page-requisites  grab css/img needed to render pages
# --convert-links  rewrite for local viewing
# --adjust-extension append .html where needed
# --wait 1         be polite (1s between requests)
# --random-wait    jitter 0.5-1.5s
# --user-agent     identify ourselves
# --reject         skip binaries we don't need
# --level=5        depth limit — primary nav + sub-pages is typically 3-4
wget \
  --mirror \
  --domains="${HOST}" \
  --page-requisites \
  --convert-links \
  --adjust-extension \
  --wait=1 \
  --random-wait \
  --level=5 \
  --no-verbose \
  --user-agent="ZeroBias-SME-Mart-Catalog-Scrape/1.0 (clark@zerobias.com)" \
  --reject='*.pdf,*.zip,*.mp4,*.mov,*.mp3,*.ico,*.woff,*.woff2,*.ttf,*.eot,*.svg' \
  --directory-prefix="$OUT_DIR" \
  "https://${HOST}/"

echo "Finish: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Pages: $(find "$OUT_DIR" -name '*.html' | wc -l | tr -d ' ')"
echo "Total size: $(du -sh "$OUT_DIR" | cut -f1)"
echo ""
echo "Next: scan for role/cert tables with:"
echo "  grep -rli -E 'certification|role|qualification' ${OUT_DIR}/${HOST}"
