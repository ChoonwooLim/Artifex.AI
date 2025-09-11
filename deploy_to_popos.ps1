# Deploy and Start PopOS Worker Server
# This script copies the server to Pop!_OS and starts it

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Deploying PopOS Worker to 10.0.0.2" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Test connection first
Write-Host "Testing Pop!_OS connection..." -ForegroundColor Yellow
$testResult = Test-PopOS
if (-not $testResult) {
    Write-Host "Failed to connect to Pop!_OS!" -ForegroundColor Red
    exit 1
}
Write-Host "Connection OK!" -ForegroundColor Green
Write-Host ""

# Copy the worker script
Write-Host "Copying worker script to Pop!_OS..." -ForegroundColor Yellow
scp popos_worker_remote.py choon@10.0.0.2:~/popos_worker.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to copy file!" -ForegroundColor Red
    exit 1
}
Write-Host "File copied successfully!" -ForegroundColor Green
Write-Host ""

# Start the server on Pop!_OS
Write-Host "Starting server on Pop!_OS..." -ForegroundColor Yellow
Write-Host "Server will run at: http://10.0.0.2:8000" -ForegroundColor Cyan
Write-Host ""

# Run server in background using nohup
ssh choon@10.0.0.2 "pkill -f popos_worker.py; nohup python3 ~/popos_worker.py > ~/popos_worker.log 2>&1 &"

Start-Sleep -Seconds 2

# Test if server is running
Write-Host "Testing server connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://10.0.0.2:8000/" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Server is running successfully!" -ForegroundColor Green
        $content = $response.Content | ConvertFrom-Json
        Write-Host "Response: $($content | ConvertTo-Json)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠ Server may take a moment to start. Check manually:" -ForegroundColor Yellow
    Write-Host "  http://10.0.0.2:8000/" -ForegroundColor White
    Write-Host ""
    Write-Host "To check logs:" -ForegroundColor Yellow
    Write-Host "  ssh choon@10.0.0.2 'tail -f ~/popos_worker.log'" -ForegroundColor White
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop the server:" -ForegroundColor Yellow
Write-Host "  ssh choon@10.0.0.2 'pkill -f popos_worker.py'" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "  ssh choon@10.0.0.2 'tail -f ~/popos_worker.log'" -ForegroundColor White