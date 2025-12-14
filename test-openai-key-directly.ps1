# Test OpenAI API Key Directly
# This tests if your OpenAI API key works by calling OpenAI directly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OpenAI API Key Direct Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please paste your OpenAI API key:" -ForegroundColor Yellow
Write-Host "(It will be hidden for security)" -ForegroundColor Gray
Write-Host ""

$apiKey = Read-Host -AsSecureString "API Key"
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
$plainKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Testing API key..." -ForegroundColor Cyan
Write-Host "Key starts with: $($plainKey.Substring(0, [Math]::Min(7, $plainKey.Length)))" -ForegroundColor Gray
Write-Host "Key length: $($plainKey.Length) characters" -ForegroundColor Gray
Write-Host ""

$body = @{
    model = "gpt-4o-mini"
    messages = @(
        @{
            role = "user"
            content = "Say 'API key is valid!' if you can read this."
        }
    )
    max_tokens = 20
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri "https://api.openai.com/v1/chat/completions" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $plainKey"
        } `
        -Body $body `
        -UseBasicParsing

    Write-Host "✅ SUCCESS! Your OpenAI API key is VALID!" -ForegroundColor Green
    Write-Host ""
    $result = $response.Content | ConvertFrom-Json
    Write-Host "AI Response: $($result.choices[0].message.content)" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ This key should work in Vercel!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Make sure this EXACT key (no extra spaces) is in Vercel" -ForegroundColor White
    Write-Host "2. Redeploy: vercel --prod" -ForegroundColor White
    
} catch {
    Write-Host "❌ ERROR: API key is INVALID!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        
        $errorJson = $errorBody | ConvertFrom-Json
        Write-Host "Error: $($errorJson.error.message)" -ForegroundColor Red
        Write-Host ""
        
        if ($errorJson.error.code -eq "invalid_api_key") {
            Write-Host "⚠️  This API key is not valid!" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Solutions:" -ForegroundColor Cyan
            Write-Host "1. Create a new API key at: https://platform.openai.com/api-keys" -ForegroundColor White
            Write-Host "2. Make sure you copied the ENTIRE key" -ForegroundColor White
            Write-Host "3. Check if the key has been revoked or expired" -ForegroundColor White
        }
    } catch {
        Write-Host "Could not parse error response" -ForegroundColor Gray
    }
}

# Clear the key from memory
$plainKey = $null
[System.GC]::Collect()

