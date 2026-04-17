#!/bin/bash
set -e

# setup.sh for sme-mart-login stack
# Handles build (npm run build at login repo root) and upload (mc cp to minio) phases
# Usage: setup.sh build|start
#
# Key point (D-05): Uses npm run build (NOT npm run build:local)
# Output directory: dist/ (per login/package.json start script)

LOG_FILE="${LOG_FILE:-./setup.log}"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

# Environment vars injected by zbb (from zbb.yaml env layer)
LOGIN_REPO_PATH="${LOGIN_REPO_PATH:-./../../../../../../login}"
AWS_ENDPOINT="${AWS_ENDPOINT:-http://localhost:9000}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-minioadmin}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-minioadmin}"
MINIO_BUCKET="${MINIO_BUCKET:-sme-mart-login}"
LOGIN_BUILD_OUTPUT="${LOGIN_BUILD_OUTPUT:-dist}"
STACK_NAME="${STACK_NAME:-sme-mart-login}"

# Derived
ALIAS_NAME="local-${STACK_NAME}"
CLOUDFRONT_CONF_VOLUME="${CLOUDFRONT_SIM_CONF:-cloudfront-sim-conf}"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] setup.sh ${1:-} starting (repo=$LOGIN_REPO_PATH)"

case "${1:-start}" in
  build)
    echo "=== PHASE: Build ==="

    # Resolve absolute path to login repo
    if [[ "$LOGIN_REPO_PATH" == /* ]]; then
      REPO_ABS="$LOGIN_REPO_PATH"
    else
      REPO_ABS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd "$LOGIN_REPO_PATH" && pwd)"
    fi

    if [[ ! -d "$REPO_ABS" ]]; then
      echo "ERROR: Login repo not found at $REPO_ABS"
      echo "  Expected: $LOGIN_REPO_PATH (absolute or relative)"
      exit 1
    fi

    # Verify package.json exists at expected location
    if [[ ! -f "$REPO_ABS/package/w3geekery/package.json" ]]; then
      echo "ERROR: Login package.json not found at $REPO_ABS/package/w3geekery/package.json"
      echo "  Did you use the correct LOGIN_REPO_PATH?"
      exit 1
    fi

    echo "Building login (repo: $REPO_ABS)"
    cd "$REPO_ABS"

    # D-05: Use npm run build (not --local)
    # This runs: node ./node_modules/@zerobias-com/dana-login-sdk/metalsmith.js
    # Output goes to dist/ (per package/w3geekery/package.json start script)
    npm run build --prefix package/w3geekery

    echo "✓ Build complete: $REPO_ABS/package/w3geekery/$LOGIN_BUILD_OUTPUT/"
    ;;

  start)
    echo "=== PHASE: Upload ==="

    # Idempotent minio alias setup
    echo "Setting up minio alias..."
    if ! command -v mc &> /dev/null; then
      MC="docker run --rm -e AWS_ENDPOINT_URL=\"${AWS_ENDPOINT}\" minio/minio:latest mc"
    else
      MC="mc"
    fi

    # Set alias (overwrites if exists)
    $MC alias set "$ALIAS_NAME" "$AWS_ENDPOINT" "$AWS_ACCESS_KEY_ID" "$AWS_SECRET_ACCESS_KEY" 2>/dev/null || true
    echo "✓ minio alias set: $ALIAS_NAME"

    # Idempotent bucket creation
    echo "Creating bucket (idempotent)..."
    $MC mb --ignore-existing "${ALIAS_NAME}/${MINIO_BUCKET}" 2>/dev/null || true
    echo "✓ Bucket exists: $MINIO_BUCKET"

    # Set bucket policy to public-read
    echo "Setting bucket policy to public..."
    $MC policy set public "${ALIAS_NAME}/${MINIO_BUCKET}" 2>/dev/null || true
    echo "✓ Bucket policy set: public"

    # Upload login build
    # Path: zbb-stacks/sme-mart-login/../../../../../../login/package/w3geekery/dist/
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PARENT_REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"

    # Resolve login repo path (same logic as build phase)
    if [[ "$LOGIN_REPO_PATH" == /* ]]; then
      REPO_ABS="$LOGIN_REPO_PATH"
    else
      REPO_ABS="$(cd "$SCRIPT_DIR" && cd "$LOGIN_REPO_PATH" && pwd)"
    fi

    BUILD_DIR="${REPO_ABS}/package/w3geekery/${LOGIN_BUILD_OUTPUT}"

    if [[ ! -d "$BUILD_DIR" ]]; then
      echo "ERROR: Login build output not found at $BUILD_DIR"
      echo "  (Did you run 'zbb build sme-mart-login' first?)"
      exit 1
    fi

    echo "Uploading login files to minio..."
    $MC cp --recursive "$BUILD_DIR"/* "${ALIAS_NAME}/${MINIO_BUCKET}/"
    echo "✓ Upload complete: $MINIO_BUCKET/"

    # Write nginx location block for cloudfront-sim
    echo "Writing nginx location block..."
    CONF_FILE="sme-mart-login.conf"
    cat > "$CONF_FILE" << 'EOF'
location /login/ {
  # Proxy to minio bucket containing login page
  proxy_pass http://minio/sme-mart-login/;

  # Standard proxy headers
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

  # Don't buffer (allow streaming)
  proxy_buffering off;
}
EOF

    # Copy to shared volume (D-13)
    echo "Copying location block to cloudfront-sim volume..."
    if docker volume ls | grep -q "$CLOUDFRONT_CONF_VOLUME"; then
      TEMP_CONTAINER=$(docker create -v "${CLOUDFRONT_CONF_VOLUME}:/mnt" alpine:latest)
      docker cp "$CONF_FILE" "$TEMP_CONTAINER:/mnt/"
      docker rm "$TEMP_CONTAINER" > /dev/null
      echo "✓ Location block copied to volume: $CLOUDFRONT_CONF_VOLUME"
    else
      echo "  (location block will be injected by hand if needed)"
    fi

    # Reload nginx (D-14) — B1 FIX: Use cloudfront-sim-nginx (actual container name) instead of ${STACK_NAME}-cloudfront-sim
    # Remove silent fallback: if reload fails, exit with error
    echo "Reloading nginx in cloudfront-sim container..."
    if docker exec cloudfront-sim-nginx nginx -s reload; then
      echo "✓ nginx reloaded"
    else
      echo "ERROR: nginx reload failed — is cloudfront-sim running?"
      exit 1
    fi
    ;;

  *)
    echo "Usage: setup.sh [build|start]"
    echo "  build: Run 'npm run build' in login/package/w3geekery to compile"
    echo "  start: Upload build to minio, write location block, reload nginx"
    exit 1
    ;;
esac

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] setup.sh complete"
