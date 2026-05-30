#!/usr/bin/env bash
# Install the portable AI harness into a target project directory.
#
# Default: refuse to overwrite. If any target path already exists, list every
# collision and exit non-zero.
#
# Flags:
#   --force         overwrite existing files at the destination
#   --yes           skip the typed confirmation prompt that --force triggers
#   --dry-run       report what would be copied / overwritten without writing
#   --destination D target project root (default: current directory)
#
# Usage:
#   ./install.sh
#   ./install.sh --destination /path/to/project
#   ./install.sh --destination ../my-project --dry-run
#   ./install.sh --destination ../my-project --force --yes

set -euo pipefail

# Requires Bash 4+ for [[, process substitution, ${var#"pattern"}, and arrays.
# macOS default bash is 3.2 — install bash 4+ via Homebrew (`brew install bash`)
# and re-run, or invoke explicitly: `/opt/homebrew/bin/bash install.sh ...`.
if [ -z "${BASH_VERSION:-}" ]; then
  printf '[harness-install] ERROR: this script requires bash, not sh/dash/zsh. Re-run with: bash install.sh ...\n' >&2
  exit 2
fi
_bash_major="${BASH_VERSINFO[0]:-0}"
if [ "$_bash_major" -lt 4 ]; then
  printf '[harness-install] ERROR: bash %s detected; bash 4+ required (macOS default is 3.2).\n' "$BASH_VERSION" >&2
  printf '[harness-install] Install via Homebrew (`brew install bash`) and run with the new bash, or use the PowerShell installer.\n' >&2
  exit 2
fi

DESTINATION="$(pwd)"
FORCE=0
YES=0
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)        FORCE=1; shift ;;
    --yes)          YES=1; shift ;;
    --dry-run)      DRY_RUN=1; shift ;;
    --destination)  DESTINATION="${2:?--destination needs a value}"; shift 2 ;;
    --destination=*) DESTINATION="${1#*=}"; shift ;;
    -h|--help)
      sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "[harness-install] Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

log()  { printf '[harness-install] %s\n' "$1"; }
warn() { printf '[harness-install] %s\n' "$1" >&2; }
err()  { printf '[harness-install] ERROR: %s\n' "$1" >&2; }

# Resolve script directory (handle symlinks).
SOURCE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd -P)"

if [[ ! -d "$DESTINATION" ]]; then
  err "Destination does not exist or is not a directory: $DESTINATION"
  exit 2
fi
TARGET_DIR="$(cd -- "$DESTINATION" &> /dev/null && pwd -P)"

if [[ "$SOURCE_DIR" == "$TARGET_DIR" ]]; then
  err "Source and destination resolve to the same path. Pick a different --destination."
  exit 2
fi

log "Source:      $SOURCE_DIR"
log "Destination: $TARGET_DIR"
[[ $DRY_RUN -eq 1 ]] && log "Mode: DRY RUN (no files will be written)"
[[ $FORCE   -eq 1 ]] && warn "Mode: --force (existing files will be overwritten)"

ENTRIES=(
  ".ai"
  ".claude"
  ".cursor"
  ".opencode"
  "AGENTS.md"
  "CLAUDE.md"
  "opencode.json"
)

# Phase 1 — collision detection.
collisions=()
for entry in "${ENTRIES[@]}"; do
  src="$SOURCE_DIR/$entry"
  dst="$TARGET_DIR/$entry"
  [[ ! -e "$src" ]] && continue

  if [[ -d "$src" ]]; then
    while IFS= read -r -d '' f; do
      rel="${f#"$src"/}"
      if [[ -e "$dst/$rel" ]]; then
        collisions+=("$entry/$rel")
      fi
    done < <(find "$src" -type f -print0)
  else
    if [[ -e "$dst" ]]; then
      collisions+=("$entry")
    fi
  fi
done

if [[ ${#collisions[@]} -gt 0 ]]; then
  warn "Collisions detected (${#collisions[@]} file(s) already exist at destination):"
  for c in "${collisions[@]}"; do printf '  - %s\n' "$c"; done
  if [[ $FORCE -ne 1 ]]; then
    err "Refusing to overwrite. Re-run with --force to overwrite, or move/remove the colliding files."
    exit 1
  fi
  if [[ $YES -ne 1 ]]; then
    read -r -p "Type 'overwrite' to confirm overwriting the ${#collisions[@]} file(s) above: " reply
    if [[ "$reply" != "overwrite" ]]; then
      err "Aborted by user."
      exit 1
    fi
  fi
fi

if [[ $DRY_RUN -eq 1 ]]; then
  log "Dry run complete. No files written."
  exit 0
fi

# Phase 2 — copy.
copied=0
for entry in "${ENTRIES[@]}"; do
  src="$SOURCE_DIR/$entry"
  dst="$TARGET_DIR/$entry"
  [[ ! -e "$src" ]] && continue

  if [[ -d "$src" ]]; then
    mkdir -p "$dst"
    # -a preserves attrs; trailing /. copies contents into dst.
    cp -a "$src/." "$dst/"
    n=$(find "$src" -type f | wc -l)
    copied=$((copied + n))
  else
    cp -a "$src" "$dst"
    copied=$((copied + 1))
  fi
done

log "Installed $copied file(s)."
log "Next: review .gitignore.harness-suggested in this staging dir and append to your project's .gitignore if desired."
log "Then run /harness-onboard (Claude Code) or paste .claude/commands/harness-onboard.md into OpenCode/Cursor."
exit 0
