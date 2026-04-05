$token = (Get-Content .env | Select-String 'PRINTIFY_API_TOKEN').ToString().Split('=')[1]
$headers = @{
    Authorization = "Bearer $token"
    'Content-Type' = 'application/json'
}
try {
    $resp = Invoke-RestMethod -Uri 'https://api.printify.com/v1/shops.json' -Headers $headers -Method Get -TimeoutSec 10
    Write-Host "Shops found: $($resp.Count)"
    $resp | ForEach-Object { Write-Host "Shop: $($_.id) - $($_.title)" }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
