# Installs the exact Zayt w Mouneh transparent PNG/WebP illustration pack.
# This is intentionally restricted to a non-production design branch.
param(
  [string]$ZipPath = (Join-Path $env:USERPROFILE "Downloads\Zayt_w_Mouneh_Transparent_Illustration_Assets.zip")
)

$ErrorActionPreference = "Stop"
$branch = "design/olive-mouneh-assets"
$expected = @(
  "olive-branch-left", "olive-branch-right", "mouneh-jars",
  "pomegranate", "zaatar-bundle", "wheat-bundle", "mortar-and-herbs",
  "lemons-and-leaves", "olive-sprig", "olive-divider", "olive-flourish"
)

function Require-Success([string]$description) {
  if ($LASTEXITCODE -ne 0) { throw "$description failed (exit code $LASTEXITCODE)." }
}

if (-not (Test-Path -LiteralPath $ZipPath -PathType Leaf)) {
  throw "Cannot find artwork ZIP: $ZipPath. Download it from ChatGPT, then supply the correct -ZipPath."
}

$root = (& git rev-parse --show-toplevel 2>$null)
Require-Success "Finding Git repository"
if (-not $root) { throw "Run this script inside your ZaytwMouneh Git checkout." }
$root = $root.Trim()
Set-Location -LiteralPath $root

$remote = (& git remote get-url origin)
Require-Success "Checking Git origin"
if ($remote -notmatch 'veyro-lb/ZaytwMouneh(\.git)?$') {
  throw "Wrong repository origin: $remote"
}

$current = (& git branch --show-current)
Require-Success "Checking current branch"
if ($current.Trim() -ne $branch) {
  throw "Switch to '$branch' first. Will not modify '$current'."
}

$dirty = @(& git status --porcelain)
Require-Success "Checking worktree"
if ($dirty.Count -gt 0) {
  throw "Uncommitted or untracked work detected. Preserve/review your Copilot work first. Nothing was changed."
}

$tempDir = Join-Path $env:TEMP ("zwm-art-assets-" + [guid]::NewGuid().ToString("N"))
try {
  Expand-Archive -LiteralPath $ZipPath -DestinationPath $tempDir -Force
  $source = Join-Path $tempDir "public\assets\decor"
  if (-not (Test-Path $source -PathType Container)) {
    throw "ZIP missing public/assets/decor. Use the original artwork ZIP."
  }

  $dest = Join-Path $root "public\assets\decor"
  New-Item -ItemType Directory -Force -Path $dest | Out-Null

  $copied = 0
  foreach ($base in $expected) {
    foreach ($ext in @("png","webp")) {
      $name = "$base.$ext"
      $src = Join-Path $source $name
      $dst = Join-Path $dest $name
      if (-not (Test-Path $src -PathType Leaf)) {
        throw "Artwork pack is missing $name. Stopping before commit."
      }
      if (Test-Path $dst -PathType Leaf) {
        $a = (Get-FileHash -LiteralPath $src -Algorithm SHA256).Hash
        $b = (Get-FileHash -LiteralPath $dst -Algorithm SHA256).Hash
        if ($a -ne $b) { throw "$name already exists with different content. Will not overwrite it." }
      } else {
        Copy-Item -LiteralPath $src -Destination $dst
        $copied++
      }
    }
  }

  & git add -- public/assets/decor/
  Require-Success "Staging illustration assets"

  & git diff --cached --quiet -- public/assets/decor/
  if ($LASTEXITCODE -eq 0) {
    Write-Host "The artwork is already present. Nothing to commit or push." -ForegroundColor Yellow
    exit 0
  }
  if ($LASTEXITCODE -ne 1) { throw "Cannot inspect staged artwork." }

  & git commit -m "Add eleven transparent botanical and mouneh illustrations"
  Require-Success "Committing illustration pack"

  & git push origin $branch
  Require-Success "Pushing safe design branch"

  Write-Host ""
  Write-Host "SUCCESS: $copied illustrations uploaded to GitHub on $branch." -ForegroundColor Green
  Write-Host "PNG and WebP are available in public/assets/decor/."
  Write-Host "Production main was NOT modified."
} finally {
  if (Test-Path -LiteralPath $tempDir) {
    Remove-Item -LiteralPath $tempDir -Recurse -Force
  }
}
