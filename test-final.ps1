# Final test of the OpenAI API

$apiUrl = "https://air-isk-monitor-api.vercel.app/api/openai"

$body = @{
    messages = @(
        @{
            role = "user"
            content = "Say 'Hello! The API is working perfectly!'"
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "🚀 Testing OpenAI API Proxy..." -ForegroundColor Cyan
Write-Host "URL: $apiUrl" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $apiUrl -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    $result = $response.Content | ConvertFrom-Json
    Write-Host "AI Response:" -ForegroundColor Yellow
    Write-Host $result.choices[0].message.content -ForegroundColor White
    Write-Host ""
    Write-Host "Model: $($result.model)" -ForegroundColor Gray
    Write-Host "Tokens used: $($result.usage.total_tokens)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "Error Details:" -ForegroundColor Yellow
        Write-Host $errorBody
    }
}

