#!/bin/bash
set -e

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}[setup] Starting sme-mart-spa setup...${NC}"

# ────────────────────────────────────────────────────────────────
# 1. Verify prerequisites
# ────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[setup] Verifying prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
  echo -e "${RED}[setup] ERROR: Docker not found. Please install Docker.${NC}"
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}[setup] ERROR: Docker Compose not found. Please install Docker Compose.${NC}"
  exit 1
fi

echo -e "${GREEN}[setup] Docker and Docker Compose are available${NC}"

# ────────────────────────────────────────────────────────────────
# 2. Build SPA if not already built
# ────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[setup] Building SPA...${NC}"

SPA_ROOT="/Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart"

if [ ! -d "$SPA_ROOT" ]; then
  echo -e "${RED}[setup] ERROR: SPA root directory not found: $SPA_ROOT${NC}"
  exit 1
fi

cd "$SPA_ROOT"

if npm run build >/dev/null 2>&1; then
  echo -e "${GREEN}[setup] SPA build complete${NC}"
else
  echo -e "${RED}[setup] ERROR: SPA build failed${NC}"
  exit 1
fi

# Verify build output exists
if [ ! -d "dist" ]; then
  echo -e "${RED}[setup] ERROR: SPA build output not found at dist/${NC}"
  exit 1
fi

echo -e "${GREEN}[setup] SPA build output verified at dist/${NC}"

# ────────────────────────────────────────────────────────────────
# 3. Verify SPA build directory is readable
# ────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[setup] Verifying SPA build directory permissions...${NC}"

if [ ! -r "dist" ]; then
  echo -e "${YELLOW}[setup] WARNING: dist/ directory is not readable. Attempting to fix...${NC}"
  chmod -R a+r dist/ || {
    echo -e "${RED}[setup] ERROR: Could not make dist/ readable${NC}"
    exit 1
  }
fi

echo -e "${GREEN}[setup] SPA build directory is readable${NC}"

# ────────────────────────────────────────────────────────────────
# 4. Copy SPA assets to docker-compose volume mount location
# ────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[setup] Preparing SPA assets for upload...${NC}"

# The docker-compose.yml mounts ./dist:/sme-mart-build:ro
# We've already built it above, so it's ready for the spa-upload container

echo -e "${GREEN}[setup] SPA assets are ready at dist/${NC}"

# ────────────────────────────────────────────────────────────────
# 5. Completion
# ────────────────────────────────────────────────────────────────
echo -e "${GREEN}[setup] Setup complete. Ready to start stack.${NC}"
exit 0
