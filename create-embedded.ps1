# Convert website_products.json to embedded JS
$jsonContent = Get-Content "website_products.json" -Raw
$jsContent = "const PRODUCTS_DATA = $jsonContent;"
$jsContent | Out-File -FilePath "products-embedded.js" -Encoding utf8

Write-Host "Created products-embedded.js"
$fileSize = (Get-Item "products-embedded.js").Length / 1MB
Write-Host "File size: $([math]::Round($fileSize, 2)) MB"