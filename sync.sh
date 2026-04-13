#!/usr/bin/env bash
set -euo pipefail

msg="${1:-Update site}"

git add -A

if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

git commit -m "$msg"
git push

