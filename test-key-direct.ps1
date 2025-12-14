# Test the exact key we added to Vercel

$apiKey = "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"

Write-Host "Testing API key directly with OpenAI..." -ForegroundColor Cyan
Write-Host "Key: $($apiKey.Substring(0, 20))..." -ForegroundColor Gray
Write-Host "Length: $($apiKey.Length)" -ForegroundColor Gray
Write-Host ""

$body = @{
    model = "gpt-4o-mini"
    messages = @(
        @{
            role = "user"
            content = "Say 'Key works!'"
        }
    )
    max_tokens = 10
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri "https://api.openai.com/v1/chat/completions" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $apiKey"
        } `
        -Body $body `
        -UseBasicParsing

    Write-Host "✅ SUCCESS! Key is valid!" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host "Response: $($result.choices[0].message.content)" -ForegroundColor White
    
} catch {
    Write-Host "❌ FAILED! Key is invalid!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error: $errorBody" -ForegroundColor Yellow
    } catch {}
}

