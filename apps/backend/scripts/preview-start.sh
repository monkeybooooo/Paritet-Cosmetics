#!/bin/sh
set -eu

UPLOADS_DIR="${STRAPI_UPLOADS_DIR:-/app/public/uploads}"
SEED_DIR="${STRAPI_UPLOADS_SEED_DIR:-/app/public/uploads-seed}"

mkdir -p "${UPLOADS_DIR}"

if [ -d "${SEED_DIR}" ]; then
  cp -an "${SEED_DIR}/." "${UPLOADS_DIR}/" 2>/dev/null || true
fi

exec npm run start
