# Split products into smaller chunks
Write-Host "Splitting products..."

$json = Get-Content "website_products.json" -Raw | ConvertFrom-Json
$total = $json.products.Count
$chunkSize = 100
$chunkNum = 0

for ($i = 0; $i -lt $total; $i += $chunkSize) {
    $chunkNum++
    $end = [Math]::Min($i + $chunkSize, $total)
    $chunk = @{
        total = $end - $i
        products = $json.products[$i..($end-1)]
    }
    
    $filename = "products_chunk_$chunkNum.json"
    $chunk | ConvertTo-Json -Depth 10 | Out-File $filename -Encoding utf8
    Write-Host "Created $filename with $($chunk.total) products"
}

Write-Host "Done! Created $chunkNum chunks"