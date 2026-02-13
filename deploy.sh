#!/usr/bin/env bash
set -e

# ============ CONFIG – set these ============
S3_BUCKET="event-management-console"
CLOUDFRONT_DISTRIBUTION_ID="E3L45PKYYSH4Z6"   # From CloudFront console, e.g. E2ABCD1234XYZ
BUILD_DIR="dist/synopsis-management-dashboard/browser"  # Angular build output for this project
# ===========================================

echo "Building Angular app..."
npm run build:prod

if [ ! -d "$BUILD_DIR" ]; then
  echo "Build directory not found: $BUILD_DIR"
  exit 1
fi

echo "Uploading to S3 bucket: $S3_BUCKET"
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET/" --delete

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*"

echo "Done. Allow 1–2 minutes for invalidation to complete."
