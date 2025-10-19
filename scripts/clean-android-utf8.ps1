$ErrorActionPreference = 'Stop'

# Root of repo assumed as parent of this scripts folder
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Write-Host "Repo root:" $RepoRoot

# Kill Java/Gradle daemons quietly
try { taskkill /F /IM java.exe /T 2>$null | Out-Null } catch {}

# Target files
$exts  = @('*.gradle','*.properties','*.xml','*.pro')
$files = Get-ChildItem -Path (Join-Path $RepoRoot 'android') -Recurse -File -Include $exts

[int]$changed = 0
foreach ($f in $files) {
  $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
  $txt   = [System.Text.Encoding]::UTF8.GetString($bytes)

  $before = $txt
  # Remove soft hyphen, embedded BOM, zero-width joiners/space and word-joiner
  $txt = $txt -replace "`u00AD","" `
               -replace "`uFEFF","" `
               -replace "`u200B","" `
               -replace "`u200C","" `
               -replace "`u200D","" `
               -replace "`u2060",""

  if ($txt -ne $before) {
    [System.IO.File]::WriteAllText($f.FullName, $txt, (New-Object System.Text.UTF8Encoding($false))) # UTF-8 no BOM
    $changed++
    Write-Host "🧹 Cleaned:" $f.FullName
  }

  # Extra verification: any 0xAD left?
  if (([System.IO.File]::ReadAllBytes($f.FullName)) -contains 0xAD) {
    Write-Warning ("Aún hay 0xAD en: {0}" -f $f.FullName)
  }
}
Write-Host ("Archivos modificados: {0}" -f $changed)

# Normalize EOL to LF for these files
foreach ($f in $files) {
  $txt = Get-Content -Raw -Path $f.FullName
  $txt = $txt -replace "`r`n","`n"
  [System.IO.File]::WriteAllText($f.FullName, $txt, (New-Object System.Text.UTF8Encoding($false)))
}

Write-Host "Normalization complete."