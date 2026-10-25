# Makes SoleTracker start automatically (hidden) when you log in to Windows,
# and puts a "SoleTracker" link on the desktop and in the Start menu.
# Run once:  powershell -ExecutionPolicy Bypass -File scripts\windows\install-autostart.ps1

$vbs = Join-Path $PSScriptRoot "start-hidden.vbs"
$shell = New-Object -ComObject WScript.Shell

$startup = [Environment]::GetFolderPath("Startup")
$lnk = $shell.CreateShortcut((Join-Path $startup "SoleTracker Server.lnk"))
$lnk.TargetPath = "$env:SystemRoot\System32\wscript.exe"
$lnk.Arguments = "`"$vbs`""
$lnk.WorkingDirectory = $PSScriptRoot
$lnk.Save()

$url = "[InternetShortcut]`r`nURL=http://soletracker`r`n"
$desktop = [Environment]::GetFolderPath("Desktop")
$programs = [Environment]::GetFolderPath("Programs")
foreach ($dir in @($desktop, $programs)) {
  Set-Content -Path (Join-Path $dir "SoleTracker.url") -Value $url -Encoding ASCII
}

# Start it now too (via Explorer so it is not tied to the terminal that ran this)
explorer.exe $vbs
Write-Host "SoleTracker will now start at login. Open http://soletracker (desktop shortcut: SoleTracker)."
