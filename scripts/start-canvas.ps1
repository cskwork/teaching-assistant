# Excalidraw Canvas Server Startup Script (Windows PowerShell)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ExcalidrawRoot = Join-Path $ProjectRoot "mcp-excalidraw-agent\mcp_excalidraw"
$Port = 3333

Write-Host "Starting Excalidraw Canvas Server..." -ForegroundColor Cyan

# Kill existing process on port
$existingProcess = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
if ($existingProcess) {
    Write-Host "Stopping existing server (PID: $existingProcess)..." -ForegroundColor Yellow
    Stop-Process -Id $existingProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Change to excalidraw directory
Set-Location $ExcalidrawRoot

# Start server in background
Write-Host "Starting Excalidraw canvas at http://localhost:$Port (background)" -ForegroundColor Green
$env:PORT = $Port
$logFile = Join-Path $ProjectRoot "mcp-excalidraw-agent\excalidraw.log"

# 분리된 프로세스로 실행해 스크립트 종료 후에도 유지
$cmdArgs = "/c node dist/server.js > `"$logFile`" 2>&1"
$process = Start-Process -FilePath "cmd.exe" -ArgumentList $cmdArgs -WorkingDirectory $ExcalidrawRoot -WindowStyle Hidden -PassThru

Write-Host "Server PID: $($process.Id)" -ForegroundColor Gray

# Wait for server to be ready
Write-Host "Waiting for server to start..."
for ($i = 1; $i -le 10; $i++) {
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "Server is running at http://localhost:$Port" -ForegroundColor Green
        Write-Host "Log file: $logFile"
        exit 0
    }
    Start-Sleep -Seconds 1
    Write-Host "." -NoNewline
}

Write-Host ""
Write-Host "Server failed to start within 10 seconds. Check $logFile for details." -ForegroundColor Red
exit 1
