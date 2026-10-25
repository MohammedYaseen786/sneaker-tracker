# Undoes install-autostart.ps1 and stops the running server.

Remove-Item (Join-Path ([Environment]::GetFolderPath("Startup")) "SoleTracker Server.lnk") -ErrorAction SilentlyContinue
foreach ($dir in @([Environment]::GetFolderPath("Desktop"), [Environment]::GetFolderPath("Programs"))) {
  Remove-Item (Join-Path $dir "SoleTracker.url") -ErrorAction SilentlyContinue
}

# Stop the restart loop first, then the server itself
Get-CimInstance Win32_Process -Filter "Name='cmd.exe'" | Where-Object { $_.CommandLine -like "*start-server.cmd*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
Write-Host "SoleTracker autostart removed and server stopped."
