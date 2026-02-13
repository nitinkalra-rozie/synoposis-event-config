# ============ CONFIG – set these ============
$S3_BUCKET = "event-management-console"
$CLOUDFRONT_DISTRIBUTION_ID = "E3L45PKYYSH4Z6"   # From CloudFront console
$BUILD_DIR = "dist/synopsis-management-dashboard/browser"  # Angular build output for this project
# ===========================================

$ErrorActionPreference = "Stop"

Write-Host "Building Angular app..."
npm run build:dev

if (-not (Test-Path $BUILD_DIR)) {
  Write-Host "Build directory not found: $BUILD_DIR"
  exit 1
}

Write-Host "Uploading to S3 bucket: $S3_BUCKET"
aws s3 sync $BUILD_DIR "s3://$S3_BUCKET/" --delete

Write-Host "Invalidating CloudFront cache..."
aws cloudfront create-invalidation `
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID `
  --paths "/*"

Write-Host "Done. Allow 1-2 minutes for invalidation to complete."
