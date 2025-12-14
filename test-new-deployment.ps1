# Test the new deployment

$apiUrl = "https://air-isk-monitor-ewuvkol6i-fayeks-projects-2705822a.vercel.app/api/openai"

$body = @{
    messages = @(
        @{
            role = "user"
            content = "Say hello!"
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Testing: $apiUrl" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $apiUrl -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host "Response: $($result.choices[0].message.content)" -ForegroundColor White
    
} catch {
    Write-Host "❌ ERROR" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error: $errorBody" -ForegroundColor Yellow
    }
}

