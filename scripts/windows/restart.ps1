# Rebuilds SoleTracker and restarts the background server. Run after changing the code.

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$env:Path = "C:\Program Files\nodejs;$env:Path"

Get-CimInstance Win32_Process -Filter "Name='cmd.exe'" | Where-Object { $_.CommandLine -like "*start-server.cmd*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

Push-Location $root
npm run build
Pop-Location

# Via Explorer so the server is not tied to the terminal that ran this
explorer.exe (Join-Path $PSScriptRoot 'start-hidden.vbs')
Write-Host "SoleTracker rebuilt and restarted at http://soletracker"
