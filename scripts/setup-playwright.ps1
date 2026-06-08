param(
  [ValidateSet('npm', 'bun')]
  [string]$PackageManager = 'npm',
  [switch]$SkipBrowserInstall
)

$ErrorActionPreference = 'Stop'

Write-Host "Setting up Playwright for Your Barber using $PackageManager..." -ForegroundColor Cyan

$directories = @(
  'e2e',
  'e2e\pages',
  'e2e\specs',
  'e2e\support',
  'scripts'
)

foreach ($directory in $directories) {
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }
}

$installCommand = if ($PackageManager -eq 'bun') {
  'bun add -d @playwright/test'
} else {
  'npm install -D @playwright/test'
}

$browserCommand = if ($PackageManager -eq 'bun') {
  'bunx playwright install chromium'
} else {
  'npx playwright install chromium'
}

Write-Host ''
Write-Host 'Exact install commands:' -ForegroundColor Yellow
Write-Host "  $installCommand"
if (-not $SkipBrowserInstall) {
  Write-Host "  $browserCommand"
}
Write-Host ''

Invoke-Expression $installCommand

if (-not $SkipBrowserInstall) {
  Invoke-Expression $browserCommand
}

Write-Host ''
Write-Host 'Recommended run commands:' -ForegroundColor Yellow
Write-Host '  npm run e2e'
Write-Host '  npm run e2e:headed'
Write-Host ''
Write-Host 'Playwright setup complete.' -ForegroundColor Green
