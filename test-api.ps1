# PowerShell script to test your Vercel API
# This will verify if your OpenAI API key is configured correctly

$apiUrl = "https://air-isk-monitor-9io6web3h-fayeks-projects-2705822a.vercel.app/api/openai"

$body = @{
    messages = @(
        @{
            role = "system"
            content = "You are a helpful assistant."
        },
        @{
            role = "user"
            content = "Say 'API is working!' if you can read this."
        }
    )
    model = "gpt-4o-mini"
    temperature = 0.7
    max_tokens = 50
} | ConvertTo-Json -Depth 10

Write-Host "Testing Vercel API..." -ForegroundColor Cyan
Write-Host "URL: $apiUrl" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "✅ SUCCESS! API is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "AI Response:" -ForegroundColor Cyan
    Write-Host $response.choices[0].message.content -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Your OpenAI API key is configured correctly in Vercel!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ ERROR: API call failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -like "*500*" -or $_.Exception.Message -like "*configuration*") {
        Write-Host "⚠️  This likely means OPENAI_API_KEY is NOT set in Vercel" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To fix:" -ForegroundColor Cyan
        Write-Host "1. Go to: https://vercel.com/fayeks-projects-2705822a/air-isk-monitor-api/settings/environment-variables" -ForegroundColor White
        Write-Host "2. Click 'Add New'" -ForegroundColor White
        Write-Host "3. Name: OPENAI_API_KEY" -ForegroundColor White
        Write-Host "4. Value: your-openai-api-key" -ForegroundColor White
        Write-Host "5. Select all environments (Production, Preview, Development)" -ForegroundColor White
        Write-Host "6. Click 'Save'" -ForegroundColor White
        Write-Host "7. Redeploy: vercel --prod" -ForegroundColor White
    }
}

