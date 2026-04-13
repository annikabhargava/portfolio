#!/usr/bin/env bash
set -euo pipefail

# LaunchAgent-friendly autosync:
# - commits any changed files with a timestamp message
# - pushes to origin
#
# Note: This intentionally does nothing when there are no changes.

cd "$(dirname "$0")"

git add -A

if git diff --cached --quiet; then
  exit 0
fi

git commit -m "Auto-sync $(date '+%Y-%m-%d %H:%M:%S')"
git push

