# Detailed API Test with Error Logging

$apiUrl = "https://air-isk-monitor-h35tlvn11-fayeks-projects-2705822a.vercel.app/api/openai"

$body = @{
    messages = @(
        @{
            role = "user"
            content = "Say hello"
        }
    )
    model = "gpt-4o-mini"
} | ConvertTo-Json -Depth 10

Write-Host "Testing API: $apiUrl" -ForegroundColor Cyan
Write-Host "Request Body:" -ForegroundColor Yellow
Write-Host $body
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $apiUrl -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.Content
    
} catch {
    Write-Host "❌ ERROR" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host ""
    
    # Try to read error response
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $errorBody = $reader.ReadToEnd()
    $reader.Close()
    
    Write-Host "Error Response:" -ForegroundColor Yellow
    Write-Host $errorBody
    Write-Host ""
    
    # Parse JSON error if possible
    try {
        $errorJson = $errorBody | ConvertFrom-Json
        Write-Host "Parsed Error:" -ForegroundColor Yellow
        Write-Host "  Error: $($errorJson.error)" -ForegroundColor Red
        if ($errorJson.error.message) {
            Write-Host "  Message: $($errorJson.error.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "Could not parse error as JSON" -ForegroundColor Gray
    }
}

