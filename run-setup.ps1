# run-setup.ps1
# Usage: save in project root and run via:
# powershell -NoProfile -ExecutionPolicy Bypass -File .\run-setup.ps1

$ErrorActionPreference = 'Stop'

Write-Host "Run setup: pulizia node_modules, install dipendenze e avvio dev server" -ForegroundColor Cyan

# Ensure we're in project folder
Set-Location (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)
Write-Host "Current folder: $(Get-Location)" -ForegroundColor Yellow

# Remove node_modules and package-lock.json for a clean install
if (Test-Path ".\node_modules") {
    Write-Host "Rimuovo node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force .\node_modules
}
if (Test-Path ".\package-lock.json") {
    Write-Host "Rimuovo package-lock.json..." -ForegroundColor Gray
    Remove-Item -Force .\package-lock.json
}

# Use npm.cmd to avoid PowerShell execution policy issues
$npm = "npm.cmd"

Write-Host "Eseguo: $npm install" -ForegroundColor Green
& $npm install

# Ensure @vitejs/plugin-react present; install if missing
$pkgJson = Join-Path (Get-Location) "package.json"
$needsPlugin = $false
if (Test-Path $pkgJson) {
    $pkg = Get-Content $pkgJson -Raw | ConvertFrom-Json
    if (-not ($pkg.devDependencies.PSObject.Properties.Name -contains '@vitejs/plugin-react') -and -not ($pkg.dependencies.PSObject.Properties.Name -contains '@vitejs/plugin-react')) {
        $needsPlugin = $true
    }
}
if ($needsPlugin) {
    Write-Host "Plugin @vitejs/plugin-react non trovato: lo installo..." -ForegroundColor Cyan
    & $npm install -D @vitejs/plugin-react
}

Write-Host "Avvio dev server: $npm run dev" -ForegroundColor Green
& $npm run dev
