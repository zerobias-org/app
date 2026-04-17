#!/bin/sh
set -e

# Entrypoint for cloudfront-sim nginx container
# Runs envsubst on nginx.conf.template to inject env vars, then starts nginx

# Explicit variable list (B2 fix: avoid clobbering nginx's $host, $remote_addr, etc.)
# Only substitute our custom vars; nginx variables remain as-is
export CLOUDFRONT_SIM_PORT="${CLOUDFRONT_SIM_PORT:-15002}"
export AWS_ENDPOINT="${AWS_ENDPOINT:-http://minio:9000}"
export UAT_ORIGIN="${UAT_ORIGIN:-https://uat.zerobias.com}"

# B2 fix: Extract MINIO_HOST and MINIO_PORT from AWS_ENDPOINT
# AWS_ENDPOINT format: http://minio:9000 or http://localhost:15000
MINIO_HOST="${AWS_ENDPOINT#*://}"     # strip scheme -> minio:9000 or localhost:15000
MINIO_HOST="${MINIO_HOST%%:*}"        # strip port   -> minio or localhost
export MINIO_HOST="${MINIO_HOST}"

MINIO_PORT="${AWS_ENDPOINT##*:}"      # Extract port (rightmost after colon)
export MINIO_PORT="${MINIO_PORT}"

# Substitute only our custom variables in the template
# (B2 fix: explicit list with MINIO_HOST and MINIO_PORT)
envsubst '${CLOUDFRONT_SIM_PORT},${MINIO_HOST},${MINIO_PORT},${AWS_ENDPOINT},${UAT_ORIGIN}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf

# Start nginx in foreground (for docker)
exec nginx -g 'daemon off;'
