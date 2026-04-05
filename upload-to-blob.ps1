$token = $env:VERCEL_BLOB_READ_WRITE_TOKEN
if (-not $token) {
    Write-Host "Token not set"
    exit 1
}

Write-Host "Uploading..."

$files = @("final_official_shop.html", "vercel.json", "success.html")

foreach ($f in $files) {
    Write-Host "Uploading $f..."
    curl.exe -X POST "https://api.vercel.com/v4/blob/upload" `
        -H "Authorization: Bearer $token" `
        -F "file=@$f"
    Write-Host ""
}

Write-Host "Done"