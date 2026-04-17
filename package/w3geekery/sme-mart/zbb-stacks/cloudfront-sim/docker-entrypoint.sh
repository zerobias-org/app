#!/bin/sh
set -e

# ────────────────────────────────────────────────────────────────
# CloudFront-sim Docker Entrypoint
# ────────────────────────────────────────────────────────────────
# Resolves environment variable placeholders in nginx.conf.template
# using envsubst, then starts nginx in foreground mode.

# Resolve env vars in nginx template
# Only substitute the variables we explicitly list (preserve nginx's own vars)
envsubst '${BASE_PATH} ${MINIO_HOST} ${MINIO_PORT} ${MINIO_BUCKET} ${LISTEN_PORT}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf

echo "[cloudfront-sim] nginx.conf resolved"
echo "[cloudfront-sim] Configuration:"
echo "[cloudfront-sim]   BASE_PATH=${BASE_PATH}"
echo "[cloudfront-sim]   MINIO_BUCKET=${MINIO_BUCKET}"
echo "[cloudfront-sim]   MINIO_HOST=${MINIO_HOST}:${MINIO_PORT}"
echo "[cloudfront-sim]   LISTEN_PORT=${LISTEN_PORT}"
echo "[cloudfront-sim]"
echo "[cloudfront-sim] Starting nginx in foreground mode..."

# Start nginx in foreground (required for Docker to track process)
exec nginx -g 'daemon off;'
