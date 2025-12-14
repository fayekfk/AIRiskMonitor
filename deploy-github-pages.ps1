Write-Host "Deploying AI Risk Monitor to GitHub Pages..." -ForegroundColor Cyan
Write-Host ""

# Check if gh-pages is installed
Write-Host "Checking dependencies..." -ForegroundColor Cyan
$packageJson = Get-Content package.json | ConvertFrom-Json
if (-not $packageJson.devDependencies.'gh-pages') {
    Write-Host "gh-pages not found. Installing..." -ForegroundColor Yellow
    npm install --save-dev gh-pages
}

Write-Host "Dependencies OK" -ForegroundColor Green
Write-Host ""

# Build the application
Write-Host "Building application..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Please fix the errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green
Write-Host ""

# Deploy to GitHub Pages
Write-Host "Deploying to GitHub Pages..." -ForegroundColor Cyan
Write-Host "   URL: https://fayekfk.github.io/AIRiskMonitor/" -ForegroundColor White
Write-Host ""

npm run deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your application is now live at:" -ForegroundColor Cyan
    Write-Host "https://fayekfk.github.io/AIRiskMonitor/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Backend API: https://air-isk-monitor-api.vercel.app" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "All AI features will use the secure Vercel API!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Open the URL above in your browser" -ForegroundColor White
    Write-Host "   2. Test the AI features (Risk Analysis, Insights, etc.)" -ForegroundColor White
    Write-Host "   3. Check browser console (F12) for any errors" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Deployment failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    Write-Host ""
}

