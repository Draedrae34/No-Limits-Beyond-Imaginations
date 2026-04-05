# Vercel Blob Upload Script - PowerShell
$token = $env:VERCEL_BLOB_READ_WRITE_TOKEN
if (-not $token) {
    Write-Host "Error: VERCEL_BLOB_READ_WRITE_TOKEN not set"
    Write-Host "Add it to your environment variables first"
    exit 1
}

Write-Host "Uploading shop files..."
Write-Host ""

$files = @{
    "final_official_shop.html" = "text/html"
    "vercel.json" = "application/json"
    "success.html" = "text/html"
    "website_products.json" = "application/json"
}

foreach ($file in $files.Keys) {
    $path = ".\$file"
    if (Test-Path $path) {
        Write-Host "Uploading $file..."
        # Use curl if available
        curl.exe -X PUT "https://blob.vercel-storage.com/$file" `
            -H "Authorization: Bearer $token" `
            -H "Content-Type: $($files[$file])" `
            --data-binary "@$path"
        Write-Host ""
    }
}

Write-Host "Done!"