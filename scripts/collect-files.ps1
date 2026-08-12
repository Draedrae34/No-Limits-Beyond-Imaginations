<#
Usage: run from PowerShell in the repo root:
  ./scripts/collect-files.ps1
Options:
  -Path <path>    : root path to scan (defaults to current directory)
  -Zip            : create a compressed ZIP of the scanned folder (may be large)
  -IncludePatterns: comma-separated file patterns to include in web-files listing (defaults: *.html,*.js,*.css,*.json,*.md)

This script collects a set of diagnostic listings that you can share for remote inspection.
#>

param(
  [string]$Path = "$(Get-Location)",
  [switch]$Zip,
  [string]$IncludePatterns = "*.html,*.js,*.css,*.json,*.md"
)

try {
  $outDir = Join-Path -Path $Path -ChildPath "dev-scan-outputs"
  if (-not (Test-Path $outDir)) { New-Item -Path $outDir -ItemType Directory | Out-Null }

  Write-Output "Scanning: $Path"

  Write-Output "Generating full recursive file list (all-files.txt)..."
  Get-ChildItem -Path $Path -Recurse -Force -ErrorAction SilentlyContinue |
	Where-Object { -not $_.PSIsContainer } |
	Select-Object @{Name='FullName';Expression={$_.FullName}}, @{Name='Length';Expression={$_.Length}} |
	Format-Table -HideTableHeaders | Out-String -Width 4096 | Out-File -Encoding utf8 (Join-Path $outDir 'all-files.txt')

  Write-Output "Generating filtered web file list (web-files.txt)..."
  $patterns = $IncludePatterns -split ',' | ForEach-Object { $_.Trim() }
  $webFiles = @()
  foreach ($pat in $patterns) {
	$webFiles += Get-ChildItem -Path $Path -Recurse -Include $pat -File -ErrorAction SilentlyContinue
  }
  $webFiles | Select-Object FullName | Out-File -Encoding utf8 (Join-Path $outDir 'web-files.txt')

  Write-Output "Searching for Lil Mystic references (lilmystic-occurrences.txt)..."
  $searchPatterns = @('Lil Mystic','lil-mystic','LilMystic','lilmystic')
  $matches = @()
  foreach ($p in $searchPatterns) {
	try {
	  $m = Select-String -Path (Join-Path $Path '*') -Pattern $p -SimpleMatch -ErrorAction SilentlyContinue
	  if ($m) { $matches += $m }
	} catch { }
  }
  if ($matches) {
	$matches | Select-Object Path, LineNumber, Line | Out-File -Encoding utf8 (Join-Path $outDir 'lilmystic-occurrences.txt')
  } else {
	"No occurrences found for patterns: $($searchPatterns -join ', ')" | Out-File -Encoding utf8 (Join-Path $outDir 'lilmystic-occurrences.txt')
  }

  Write-Output "Gathering git tracked files and status if git is available..."
  if (Get-Command git -ErrorAction SilentlyContinue) {
	try { git -C $Path rev-parse --show-toplevel 2>$null | Out-Null; git -C $Path ls-files > (Join-Path $outDir 'git-tracked-files.txt') } catch { }
	try { git -C $Path status --porcelain > (Join-Path $outDir 'git-status.txt') } catch { }
	try { git -C $Path branch -a > (Join-Path $outDir 'git-branches.txt') } catch { }
  } else {
	"git not found on PATH; skipping git checks." | Out-File -Encoding utf8 (Join-Path $outDir 'git-not-found.txt')
  }

  Write-Output "Writing summary (scan-summary.txt)..."
  $summary = @()
  $summary += "Scan path: $Path"
  $summary += "Output directory: $outDir"
  $summary += "Total files found: $(Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count)"
  $summary += "Web files captured: $($webFiles.Count)"
  $summary | Out-File -Encoding utf8 (Join-Path $outDir 'scan-summary.txt')

  if ($Zip) {
	$zipPath = Join-Path $Path 'workspace-scan.zip'
	Write-Output "Creating ZIP: $zipPath (may be large)..."
	try {
	  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
	  Compress-Archive -Path (Join-Path $Path '*') -DestinationPath $zipPath -Force -ErrorAction Stop
	  Write-Output "ZIP created: $zipPath"
	} catch {
	  Write-Output "ZIP failed: $_"
	}
  }

  Write-Output "Scan complete. Outputs are in: $outDir"
  Write-Output "Please upload or paste the files from that directory for me to inspect further."
  exit 0
} catch {
  Write-Output "Error during scan: $_"
  exit 1
}
