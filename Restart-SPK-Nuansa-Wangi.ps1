$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeCommand = (Get-Command node.exe -ErrorAction Stop).Source
$backendPort = 3002
$frontendPort = 5173
$backendLog = Join-Path $env:TEMP 'spk-nuansa-wangi-backend.log'
$frontendLog = Join-Path $env:TEMP 'spk-nuansa-wangi-frontend.log'

$listener = Get-NetTCPConnection -LocalPort $backendPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:$backendPort/api/health" -TimeoutSec 3
  if ($health.service -ne 'spk-nuansa-wangi-api') { throw "Port $backendPort dipakai aplikasi lain. Tidak ada proses yang dihentikan." }
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
  if (-not $process -or $process.Name -notmatch '^node(\.exe)?$' -or $process.CommandLine -notmatch 'src[\\/]server\.js') { throw 'Identitas proses backend tidak cocok. Tidak ada proses yang dihentikan.' }
  Stop-Process -Id $listener.OwningProcess -Force
  $deadline = (Get-Date).AddSeconds(8)
  do { Start-Sleep -Milliseconds 300; $stillListening = Get-NetTCPConnection -LocalPort $backendPort -State Listen -ErrorAction SilentlyContinue } while ($stillListening -and (Get-Date) -lt $deadline)
  if ($stillListening) { throw "Backend belum melepas port $backendPort." }
}

Start-Process -FilePath $nodeCommand -ArgumentList 'src/server.js' -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -RedirectStandardOutput $backendLog -RedirectStandardError ($backendLog + '.err')
if (-not (Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction SilentlyContinue)) {
  Start-Process -FilePath $nodeCommand -ArgumentList @('node_modules/vite/bin/vite.js','--host','0.0.0.0') -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -RedirectStandardOutput $frontendLog -RedirectStandardError ($frontendLog + '.err')
}

$deadline = (Get-Date).AddSeconds(25)
do {
  Start-Sleep -Milliseconds 500
  try { $apiReady = (Invoke-RestMethod -Uri "http://127.0.0.1:$backendPort/api/health" -TimeoutSec 2).service -eq 'spk-nuansa-wangi-api' } catch { $apiReady = $false }
  $frontReady = [bool](Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction SilentlyContinue)
} until (($apiReady -and $frontReady) -or (Get-Date) -ge $deadline)
if (-not ($apiReady -and $frontReady)) { throw 'Aplikasi belum siap. Periksa %TEMP%\spk-nuansa-wangi-backend.log dan log frontend.' }
Start-Process 'http://localhost:5173/reports'
