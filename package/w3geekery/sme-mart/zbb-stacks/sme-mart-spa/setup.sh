#!/bin/bash
set -e

# setup.sh for sme-mart-spa stack
# Handles build (npm run build:stack) and upload (mc cp to minio) phases
# Usage: setup.sh build|start

LOG_FILE="${LOG_FILE:-./setup.log}"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

# Environment vars injected by zbb (from zbb.yaml env layer)
SPA_REPO_PATH="${SPA_REPO_PATH:-./../../}"
AWS_ENDPOINT="${AWS_ENDPOINT:-http://localhost:9000}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-minioadmin}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-minioadmin}"
MINIO_BUCKET="${MINIO_BUCKET:-sme-mart-app}"
SPA_BUILD_OUTPUT="${SPA_BUILD_OUTPUT:-dist/sme-mart}"
STACK_NAME="${STACK_NAME:-sme-mart-spa}"

# Derived
ALIAS_NAME="local-${STACK_NAME}"
CLOUDFRONT_CONF_VOLUME="${CLOUDFRONT_SIM_CONF:-cloudfront-sim-conf}"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] setup.sh ${1:-} starting (repo=$SPA_REPO_PATH)"

case "${1:-start}" in
  build)
    echo "=== PHASE: Build ==="

    # Resolve absolute path to repo
    if [[ "$SPA_REPO_PATH" == /* ]]; then
      REPO_ABS="$SPA_REPO_PATH"
    else
      REPO_ABS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd "$SPA_REPO_PATH" && pwd)"
    fi

    if [[ ! -d "$REPO_ABS" ]]; then
      echo "ERROR: SPA repo not found at $REPO_ABS"
      exit 1
    fi

    echo "Building SME Mart SPA (repo: $REPO_ABS)"
    cd "$REPO_ABS"
    npm run build:stack
    echo "✓ Build complete: $REPO_ABS/$SPA_BUILD_OUTPUT/"
    ;;

  start)
    echo "=== PHASE: Upload ==="

    # Idempotent minio alias setup (D-05 fix: use minio/mc image, not busybox)
    echo "Setting up minio alias..."
    # Run mc via docker if local mc unavailable (fallback)
    if ! command -v mc &> /dev/null; then
      echo "  (Local mc not found, using docker minio/mc image)"
      MC="docker run --rm -e AWS_ENDPOINT_URL=\"${AWS_ENDPOINT}\" minio/minio:latest mc"
    else
      MC="mc"
    fi

    # Set alias (overwrites if exists)
    $MC alias set "$ALIAS_NAME" "$AWS_ENDPOINT" "$AWS_ACCESS_KEY_ID" "$AWS_SECRET_ACCESS_KEY" 2>/dev/null || true
    echo "✓ minio alias set: $ALIAS_NAME"

    # Idempotent bucket creation (Pitfall 5 fix)
    echo "Creating bucket (idempotent)..."
    $MC mb --ignore-existing "${ALIAS_NAME}/${MINIO_BUCKET}" 2>/dev/null || true
    echo "✓ Bucket exists: $MINIO_BUCKET"

    # Set bucket policy to public-read (required for nginx proxy without auth)
    echo "Setting bucket policy to public..."
    $MC policy set public "${ALIAS_NAME}/${MINIO_BUCKET}" 2>/dev/null || true
    echo "✓ Bucket policy set: public"

    # Upload SPA build (resolve path relative to this script dir)
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PARENT_REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"
    BUILD_DIR="${PARENT_REPO}/${SPA_BUILD_OUTPUT}"

    if [[ ! -d "$BUILD_DIR" ]]; then
      echo "ERROR: SPA build output not found at $BUILD_DIR"
      echo "  (Did you run 'npm run build:stack' first?)"
      exit 1
    fi

    # Angular 21 builder emits SPA assets under dist/<app>/browser/ (SSR-aware layout).
    # nginx proxies /sme-mart/ -> minio://sme-mart-app/ (bucket root), so upload from
    # browser/ if it exists; otherwise fall back to build-dir root for older layouts.
    UPLOAD_DIR="$BUILD_DIR"
    if [[ -d "$BUILD_DIR/browser" && -f "$BUILD_DIR/browser/index.html" ]]; then
      UPLOAD_DIR="$BUILD_DIR/browser"
    fi
    echo "Uploading SPA files to minio (from $UPLOAD_DIR)..."
    # --overwrite ensures index.html + hashed bundles replace the stale copies from prior builds.
    $MC mirror --overwrite --remove "$UPLOAD_DIR" "${ALIAS_NAME}/${MINIO_BUCKET}/"
    echo "✓ Upload complete: $MINIO_BUCKET/"

    # Write nginx location block for cloudfront-sim (D-12, D-14)
    echo "Writing nginx location block..."
    CONF_FILE="sme-mart-spa.conf"
    cat > "$CONF_FILE" << 'EOF'
location /sme-mart/ {
  # Proxy to minio bucket
  proxy_pass http://minio/sme-mart-app/;

  # SPA deep-route fallback: /sme-mart/rfps/abc123 -> /sme-mart/index.html
  error_page 404 =200 /sme-mart/index.html;

  # Standard proxy headers
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

  # Don't buffer (allow streaming)
  proxy_buffering off;
}
EOF

    # Copy to shared volume (D-13: named docker volume)
    # For docker volume, use docker cp; for zbb slot-dir bind mount, just cp
    echo "Copying location block to cloudfront-sim volume..."
    if docker volume ls | grep -q "$CLOUDFRONT_CONF_VOLUME"; then
      # Use docker container to write to volume
      TEMP_CONTAINER=$(docker create -v "${CLOUDFRONT_CONF_VOLUME}:/mnt" alpine:latest)
      docker cp "$CONF_FILE" "$TEMP_CONTAINER:/mnt/"
      docker rm "$TEMP_CONTAINER" > /dev/null
      echo "✓ Location block copied to volume: $CLOUDFRONT_CONF_VOLUME"
    else
      # Fallback: assume it's a bind mount directory
      CONF_TARGET="/etc/nginx/conf.d/apps/$CONF_FILE"
      cp "$CONF_FILE" "$CONF_TARGET" 2>/dev/null || echo "  (location block will be injected by hand if needed)"
    fi

    # Reload nginx (D-14) — find the cloudfront-sim nginx container by compose label.
    # zbb substitutes ${STACK_NAME} with the slot name, not the stack alias, so the
    # container name is unpredictable (e.g. sme-mart-local-nginx, not cloudfront-sim-nginx).
    echo "Reloading nginx in cloudfront-sim container..."
    CFS_CONTAINER=$(docker ps --filter "label=com.docker.compose.service=nginx" --filter "label=zerobias.slot" --format '{{.Names}}' | head -1)
    if [ -z "$CFS_CONTAINER" ]; then
      echo "ERROR: cloudfront-sim nginx container not found — is cloudfront-sim running?"
      exit 1
    fi
    if docker exec "$CFS_CONTAINER" nginx -s reload; then
      echo "✓ nginx reloaded ($CFS_CONTAINER)"
    else
      echo "ERROR: nginx reload failed in $CFS_CONTAINER"
      exit 1
    fi
    ;;

  *)
    echo "Usage: setup.sh [build|start]"
    echo "  build: Run 'npm run build:stack' to compile Angular"
    echo "  start: Upload build to minio, write location block, reload nginx"
    exit 1
    ;;
esac

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] setup.sh complete"
