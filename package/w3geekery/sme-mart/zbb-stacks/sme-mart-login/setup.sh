#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}[setup] Starting sme-mart-login setup...${NC}"

# 1. Verify login repo exists
if [ -z "${LOGIN_REPO_PATH}" ]; then
  echo -e "${RED}[setup] ERROR: LOGIN_REPO_PATH not set${NC}"
  exit 1
fi

if [ ! -d "${LOGIN_REPO_PATH}" ]; then
  echo -e "${RED}[setup] ERROR: Login repo not found at ${LOGIN_REPO_PATH}${NC}"
  exit 1
fi

echo -e "${GREEN}[setup] Login repo found at ${LOGIN_REPO_PATH}${NC}"

# 2. Verify package.json exists
if [ ! -f "${LOGIN_REPO_PATH}/package/w3geekery/package.json" ]; then
  echo -e "${RED}[setup] ERROR: package.json not found at ${LOGIN_REPO_PATH}/package/w3geekery/package.json${NC}"
  exit 1
fi

echo -e "${GREEN}[setup] package.json found${NC}"

# 3. Verify Docker is running
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}[setup] ERROR: Docker is not running${NC}"
  exit 1
fi

echo -e "${GREEN}[setup] Docker is running${NC}"

# 4. Verify environment variables
if [ -z "${AWS_ENDPOINT}" ]; then
  echo -e "${RED}[setup] ERROR: AWS_ENDPOINT not set (imported from cloudfront-sim)${NC}"
  exit 1
fi

if [ -z "${MINIO_BUCKET}" ]; then
  echo -e "${RED}[setup] ERROR: MINIO_BUCKET not set${NC}"
  exit 1
fi

echo -e "${GREEN}[setup] Environment variables OK${NC}"

# 5. Install npm dependencies in login/package/w3geekery if needed
if [ ! -d "${LOGIN_REPO_PATH}/package/w3geekery/node_modules" ]; then
  echo -e "${YELLOW}[setup] Installing npm dependencies in login/package/w3geekery...${NC}"
  cd "${LOGIN_REPO_PATH}/package/w3geekery"
  npm install
  cd - >/dev/null
fi

echo -e "${GREEN}[setup] Setup complete. Ready to start docker-compose services.${NC}"
echo -e "${YELLOW}[setup] docker-compose service (login-upload) will:${NC}"
echo -e "${YELLOW}  1. Build login repo${NC}"
echo -e "${YELLOW}  2. Wait for MinIO${NC}"
echo -e "${YELLOW}  3. Create bucket ${MINIO_BUCKET}${NC}"
echo -e "${YELLOW}  4. Upload assets to s3://${MINIO_BUCKET}/auth/${NC}"
exit 0
