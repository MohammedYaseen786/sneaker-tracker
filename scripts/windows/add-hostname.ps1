# Points http://soletracker at this laptop by adding it to the Windows hosts file. Needs admin.

$hosts = "$env:SystemRoot\System32\drivers\etc\hosts"
if (-not (Select-String -Path $hosts -Pattern "^\s*127\.0\.0\.1\s+soletracker\s*$" -Quiet)) {
  Add-Content -Path $hosts -Value "`r`n127.0.0.1 soletracker" -Encoding ASCII
}
ipconfig /flushdns | Out-Null
