# Update OpenAI API Key in Vercel
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Update Vercel Environment Variable" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please paste your OpenAI API key:" -ForegroundColor Yellow
Write-Host "(The same one that just worked)" -ForegroundColor Gray
Write-Host ""

$apiKey = Read-Host -AsSecureString "API Key"
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
$plainKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Updating Vercel environment variable..." -ForegroundColor Cyan
Write-Host ""

# Save to temporary file
$tempFile = [System.IO.Path]::GetTempFileName()
$plainKey | Out-File -FilePath $tempFile -Encoding ASCII -NoNewline

Write-Host "Run these commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "cd E:\I2e\Hackathon2025\Git1\AIRiskMonitor-API" -ForegroundColor White
Write-Host ""
Write-Host "# Remove old variable" -ForegroundColor Gray
Write-Host "vercel env rm OPENAI_API_KEY production" -ForegroundColor White
Write-Host ""
Write-Host "# Add new variable (paste your key when prompted)" -ForegroundColor Gray
Write-Host "vercel env add OPENAI_API_KEY production" -ForegroundColor White
Write-Host ""
Write-Host "# Also add for preview and development" -ForegroundColor Gray
Write-Host "vercel env add OPENAI_API_KEY preview" -ForegroundColor White
Write-Host "vercel env add OPENAI_API_KEY development" -ForegroundColor White
Write-Host ""
Write-Host "# Redeploy" -ForegroundColor Gray
Write-Host "vercel --prod" -ForegroundColor White
Write-Host ""

# Clear
$plainKey = $null
Remove-Item $tempFile -Force
[System.GC]::Collect()

