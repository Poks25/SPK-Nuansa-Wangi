$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeCommand = (Get-Command node.exe -ErrorAction Stop).Source
$backendLog = Join-Path $env:TEMP 'spk-nuansa-wangi-backend.log'
$frontendLog = Join-Path $env:TEMP 'spk-nuansa-wangi-frontend.log'
if (-not (Test-NetConnection 127.0.0.1 -Port 3002 -InformationLevel Quiet -WarningAction SilentlyContinue)) { Start-Process -FilePath $nodeCommand -ArgumentList 'src/server.js' -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -RedirectStandardOutput $backendLog -RedirectStandardError ($backendLog + '.err') }
if (-not (Test-NetConnection 127.0.0.1 -Port 5173 -InformationLevel Quiet -WarningAction SilentlyContinue)) { Start-Process -FilePath $nodeCommand -ArgumentList @('node_modules/vite/bin/vite.js','--host','0.0.0.0') -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -RedirectStandardOutput $frontendLog -RedirectStandardError ($frontendLog + '.err') }
$deadline = (Get-Date).AddSeconds(20)
do {
  Start-Sleep -Milliseconds 500
  $frontReady = Test-NetConnection 127.0.0.1 -Port 5173 -InformationLevel Quiet -WarningAction SilentlyContinue
  $apiReady = Test-NetConnection 127.0.0.1 -Port 3002 -InformationLevel Quiet -WarningAction SilentlyContinue
  $ready = $frontReady -and $apiReady
} until ($ready -or (Get-Date) -ge $deadline)
Start-Process 'http://localhost/SPK%20Nuansa%20Wangi/'
