# Ollama Windows Installation Script
Write-Host "=== Ollama Installation for Windows ===" -ForegroundColor Cyan

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires Administrator privileges. Please run as Administrator." -ForegroundColor Red
    exit 1
}

# Download Ollama installer
$ollamaUrl = "https://ollama.com/download/OllamaSetup.exe"
$installerPath = "$env:TEMP\OllamaSetup.exe"

Write-Host "Downloading Ollama installer..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $ollamaUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "Download completed." -ForegroundColor Green
} catch {
    Write-Host "Failed to download Ollama: $_" -ForegroundColor Red
    exit 1
}

# Install Ollama silently
Write-Host "Installing Ollama..." -ForegroundColor Yellow
try {
    Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait
    Write-Host "Installation completed." -ForegroundColor Green
} catch {
    Write-Host "Failed to install Ollama: $_" -ForegroundColor Red
    exit 1
}

# Add Ollama to PATH if not already present
$ollamaPath = "$env:LOCALAPPDATA\Programs\Ollama"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$ollamaPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$ollamaPath", "User")
    Write-Host "Added Ollama to PATH." -ForegroundColor Green
}

# Refresh environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Start Ollama service
Write-Host "Starting Ollama service..." -ForegroundColor Yellow
Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden

Start-Sleep -Seconds 3

# Verify installation
Write-Host "`nVerifying installation..." -ForegroundColor Yellow
ollama --version

Write-Host "`n=== Ollama Installation Complete ===" -ForegroundColor Green
Write-Host "You can now pull models using: ollama pull <model-name>" -ForegroundColor Cyan