# usage: .\test_stripe_order.ps1 -ProductId "5" -VariantId "71354"
param (
    [string]$ProductId = "5",    # Default: Unisex Cotton Crew Tee
    [string]$VariantId = "71354" # Default: Size L
)

Write-Host "--- Initiating Quantum Order Manifestation ---" -ForegroundColor Cyan
Write-Host "Targeting Product: $ProductId"
Write-Host "Targeting Variant: $VariantId"

stripe trigger checkout.session.completed `
  --override "checkout_session:line_items[0]:price_data:product_data:metadata:printify_product_id=$ProductId" `
  --override "checkout_session:line_items[0]:price_data:product_data:metadata:printify_variant_id=$VariantId" `
  --override "checkout_session:customer_details:email=soul_tester@silent-spirits.com" `
  --override "checkout_session:shipping_details:name=Spirit Walker" `
  --override "checkout_session:shipping_details:address:line1=123 Galactic Way" `
  --override "checkout_session:shipping_details:address:city=Portal City" `
  --override "checkout_session:shipping_details:address:state=NY" `
  --override "checkout_session:shipping_details:address:postal_code=10001" `
  --override "checkout_session:shipping_details:address:country=US"

Write-Host "--- Signal Sent to Webhook ---" -ForegroundColor Green