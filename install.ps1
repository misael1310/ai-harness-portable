<#
.SYNOPSIS
  Install the portable AI harness into a target project directory.

.DESCRIPTION
  Copies the .ai/, .claude/, .cursor/, AGENTS.md, CLAUDE.md, and opencode.json
  bundles from this staging directory into a destination project.

  Default behavior: refuse to overwrite. If any target path already exists, list
  every collision and exit with a non-zero code.

  -Force: overwrite existing files at the destination (still asks for typed
    confirmation unless -Yes is also passed).
  -Yes: skip the typed confirmation prompt that -Force triggers.
  -DryRun: report what would be copied / overwritten without writing anything.

.PARAMETER Destination
  Absolute or relative path to the target project root. Defaults to current
  directory.

.EXAMPLE
  .\install.ps1
  .\install.ps1 -Destination "C:\repos\my-project"
  .\install.ps1 -Destination "..\my-project" -DryRun
  .\install.ps1 -Destination "..\my-project" -Force -Yes
#>
[CmdletBinding()]
param(
  [string]$Destination = (Get-Location).Path,
  [switch]$Force,
  [switch]$Yes,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Write-Info  ($msg) { Write-Host "[harness-install] $msg" -ForegroundColor Cyan }
function Write-Warn  ($msg) { Write-Host "[harness-install] $msg" -ForegroundColor Yellow }
function Write-Err   ($msg) { Write-Host "[harness-install] $msg" -ForegroundColor Red }

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$source = (Resolve-Path -LiteralPath $scriptDir).Path

try {
  $target = (Resolve-Path -LiteralPath $Destination -ErrorAction Stop).Path
} catch {
  Write-Err "Destination does not exist: $Destination"
  exit 2
}

if (-not (Test-Path -LiteralPath $target -PathType Container)) {
  Write-Err "Destination is not a directory: $target"
  exit 2
}

# Guard: refuse to install into the staging directory itself.
if ($source -eq $target) {
  Write-Err "Source and destination resolve to the same path. Pick a different -Destination."
  exit 2
}

Write-Info "Source:      $source"
Write-Info "Destination: $target"
if ($DryRun) { Write-Info "Mode: DRY RUN (no files will be written)" }
if ($Force)  { Write-Warn "Mode: --Force (existing files will be overwritten)" }

# Top-level entries that ship with the harness. Anything not listed here stays
# inside the staging directory and is never copied (install.ps1, install.sh,
# README.md, .gitignore.harness-suggested).
$entries = @(
  ".ai",
  ".claude",
  ".cursor",
  ".opencode",
  "AGENTS.md",
  "CLAUDE.md",
  "opencode.json"
)

# Phase 1 — collision detection.
$collisions = New-Object System.Collections.Generic.List[string]
foreach ($entry in $entries) {
  $sourcePath = Join-Path -Path $source -ChildPath $entry
  $targetPath = Join-Path -Path $target -ChildPath $entry
  if (-not (Test-Path -LiteralPath $sourcePath)) { continue }

  if (Test-Path -LiteralPath $sourcePath -PathType Container) {
    Get-ChildItem -LiteralPath $sourcePath -Recurse -File | ForEach-Object {
      $rel = $_.FullName.Substring($sourcePath.Length).TrimStart('\','/')
      $destFile = Join-Path -Path $targetPath -ChildPath $rel
      if (Test-Path -LiteralPath $destFile) {
        $collisions.Add((Join-Path $entry $rel))
      }
    }
  } else {
    if (Test-Path -LiteralPath $targetPath) {
      $collisions.Add($entry)
    }
  }
}

if ($collisions.Count -gt 0) {
  Write-Warn "Collisions detected ($($collisions.Count) file(s) already exist at destination):"
  foreach ($c in $collisions) { Write-Host "  - $c" }
  if (-not $Force) {
    Write-Err "Refusing to overwrite. Re-run with -Force to overwrite, or move/remove the colliding files."
    exit 1
  }
  if (-not $Yes) {
    $reply = Read-Host "Type 'overwrite' to confirm overwriting the $($collisions.Count) file(s) above"
    if ($reply -ne 'overwrite') {
      Write-Err "Aborted by user."
      exit 1
    }
  }
}

if ($DryRun) {
  Write-Info "Dry run complete. No files written."
  exit 0
}

# Phase 2 — copy.
$copied = 0
foreach ($entry in $entries) {
  $sourcePath = Join-Path -Path $source -ChildPath $entry
  $targetPath = Join-Path -Path $target -ChildPath $entry
  if (-not (Test-Path -LiteralPath $sourcePath)) { continue }

  if (Test-Path -LiteralPath $sourcePath -PathType Container) {
    Copy-Item -LiteralPath $sourcePath -Destination $target -Recurse -Force
    $copied += (Get-ChildItem -LiteralPath $sourcePath -Recurse -File).Count
  } else {
    Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
    $copied += 1
  }
}

Write-Info "Installed $copied file(s)."
Write-Info "Next: review .gitignore.harness-suggested in this staging dir and append to your project's .gitignore if desired."
Write-Info "Then run /harness-onboard (Claude Code) or paste .claude/commands/harness-onboard.md into OpenCode/Cursor."
exit 0
