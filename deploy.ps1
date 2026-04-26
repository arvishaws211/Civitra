# Civitra Deployment Script
$PROJECT_ID = "civitra"
$REGION = "us-central1"

Write-Host "🚀 Starting Civitra Deployment to Cloud Run..." -ForegroundColor Cyan

# 1. Load API Key from .env
if (Test-Path .env) {
    $envContent = Get-Content .env
    $apiKeyLine = $envContent | Where-Object { $_ -match "^GEMINI_API_KEY=" }
    if ($apiKeyLine) {
        $GEMINI_API_KEY = $apiKeyLine.Split('=')[1].Trim()
    }
}

if (-not $GEMINI_API_KEY -or $GEMINI_API_KEY -eq "your_gemini_api_key_here") {
    $GEMINI_API_KEY = Read-Host "Enter your GEMINI_API_KEY"
}

# 2. Deploy
Write-Host "📦 Building and deploying to Google Cloud..." -ForegroundColor Yellow

gcloud run deploy civitra `
    --project $PROJECT_ID `
    --source . `
    --region $REGION `
    --allow-unauthenticated `
    --set-env-vars="GEMINI_API_KEY=$GEMINI_API_KEY"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Civitra is LIVE!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Deployment failed. Please check the errors above." -ForegroundColor Red
}
