# Very verbose API test

$apiUrl = "https://air-isk-monitor-dirbirifh-fayeks-projects-2705822a.vercel.app/api/openai"

$body = @{
    messages = @(
        @{
            role = "user"
            content = "Hello"
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Testing: $apiUrl" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $apiUrl -Method Post -Body $body -ContentType "application/json" -UseBasicParsing -Verbose
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host $response.Content
    
} catch {
    Write-Host "❌ ERROR" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        
        Write-Host ""
        Write-Host "Full Error Response:" -ForegroundColor Yellow
        Write-Host $errorBody
        
        if ($errorBody) {
            try {
                $errorJson = $errorBody | ConvertFrom-Json
                Write-Host ""
                Write-Host "Parsed Error:" -ForegroundColor Yellow
                Write-Host ($errorJson | ConvertTo-Json -Depth 10)
            } catch {
                Write-Host "Could not parse as JSON" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host ""
    Write-Host "Full Exception:" -ForegroundColor Gray
    Write-Host $_.Exception.Message
}

