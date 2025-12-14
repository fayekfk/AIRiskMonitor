Write-Host "🚀 Deploying AI Risk Monitor Frontend to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Check if .vercel directory exists
if (Test-Path .vercel) {
    Write-Host "⚠️  Found existing .vercel directory. Removing it to create a new project..." -ForegroundColor Yellow
    Remove-Item -Path .vercel -Recurse -Force
}

Write-Host "📦 Building the application..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix the errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: When prompted:" -ForegroundColor Yellow
Write-Host "  1. 'Set up and deploy?' → Type: yes" -ForegroundColor White
Write-Host "  2. 'Which scope?' → Press Enter (use default)" -ForegroundColor White
Write-Host "  3. 'Link to existing project?' → Type: no" -ForegroundColor White
Write-Host "  4. 'Project name?' → Press Enter (use default: AIRiskMonitor)" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue with deployment..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
vercel --prod

