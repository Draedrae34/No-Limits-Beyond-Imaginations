#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

ENV_FILE="$ROOT_DIR/env/r2_credentials.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing credentials file: $ENV_FILE"
  echo "Copy env/r2_credentials.env.example to env/r2_credentials.env and fill in your Cloudflare R2 keys."
  exit 1
fi

source "$ENV_FILE"

if [[ -z "${CF_ACCOUNT_ID:-}" || -z "${CF_ACCESS_KEY_ID:-}" || -z "${CF_SECRET_ACCESS_KEY:-}" || -z "${R2_BUCKET:-}" ]]; then
  echo "CF_ACCOUNT_ID, CF_ACCESS_KEY_ID, CF_SECRET_ACCESS_KEY, and R2_BUCKET must all be set."
  exit 1
fi

export AWS_ACCESS_KEY_ID="$CF_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$CF_SECRET_ACCESS_KEY"
export AWS_REGION="${AWS_REGION:-us-east-1}"
ENDPOINT_URL="https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com"

upload_dir() {
  local src_dir="$1"
  local dest_prefix="$2"

  if [[ ! -d "$src_dir" ]]; then
    echo "Skipping $src_dir — directory does not exist."
    return
  fi

  echo "Syncing $src_dir → s3://$R2_BUCKET/$dest_prefix/"
  aws --endpoint-url "$ENDPOINT_URL" s3 sync "$src_dir" "s3://$R2_BUCKET/$dest_prefix" --no-guess-mime-type --acl public-read
}

upload_dir "$ROOT_DIR/remembrance/photos" "remembrance/photos"
upload_dir "$ROOT_DIR/uploads/my-story" "story"
upload_dir "$ROOT_DIR/Clothing_Product" "clothing"

MEDIA_BASE_URL="https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com/$R2_BUCKET"
echo "=== Manifest base URL set to $MEDIA_BASE_URL ==="

export MEDIA_BASE_URL
npm run build:media-manifest

echo "=== Upload complete. Media manifest rebuilt pointing at $MEDIA_BASE_URL ==="
