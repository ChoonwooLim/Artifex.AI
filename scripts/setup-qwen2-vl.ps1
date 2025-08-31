# Qwen2-VL-7B Model Setup Script for Ollama
Write-Host "=== Qwen2-VL-7B Model Setup ===" -ForegroundColor Cyan

# Check if Ollama is installed
try {
    $ollamaVersion = ollama --version
    Write-Host "Ollama is installed: $ollamaVersion" -ForegroundColor Green
} catch {
    Write-Host "Ollama is not installed. Please run install-ollama.ps1 first." -ForegroundColor Red
    exit 1
}

# Check if Ollama service is running
$ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if (-not $ollamaProcess) {
    Write-Host "Starting Ollama service..." -ForegroundColor Yellow
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# Pull Qwen2-VL-7B model
Write-Host "`nPulling Qwen2-VL-7B model (this may take several minutes)..." -ForegroundColor Yellow
Write-Host "Model size: ~7GB" -ForegroundColor Gray

try {
    # Pull the vision-language model
    ollama pull qwen2-vl:7b
    Write-Host "Qwen2-VL-7B model downloaded successfully!" -ForegroundColor Green
} catch {
    Write-Host "Failed to pull model: $_" -ForegroundColor Red
    Write-Host "Trying alternative model..." -ForegroundColor Yellow
    
    # Try alternative multimodal models
    try {
        ollama pull llava:7b
        Write-Host "LLaVA-7B model downloaded as alternative!" -ForegroundColor Green
    } catch {
        Write-Host "Failed to pull alternative model: $_" -ForegroundColor Red
        exit 1
    }
}

# List available models
Write-Host "`nAvailable models:" -ForegroundColor Cyan
ollama list

# Test the model
Write-Host "`nTesting model..." -ForegroundColor Yellow
$testPrompt = "Hello, can you see images?"
$response = ollama run qwen2-vl:7b $testPrompt --max-tokens 50

if ($response) {
    Write-Host "Model test successful!" -ForegroundColor Green
    Write-Host "Response: $response" -ForegroundColor Gray
} else {
    Write-Host "Model test failed. Please check Ollama logs." -ForegroundColor Red
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "The model is ready to use with the LocalLLMService!" -ForegroundColor Cyan