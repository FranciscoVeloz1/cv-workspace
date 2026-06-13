#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STATUS_ONLY=false
COMMIT=false

for arg in "$@"; do
  case "$arg" in
    --status)
      STATUS_ONLY=true
      ;;
    --commit)
      COMMIT=true
      ;;
    -h|--help)
      echo "Usage: $0 [--status] [--commit]"
      echo "  --status  Show submodule SHAs/branches without updating"
      echo "  --commit  Commit submodule pointer updates in the parent repo"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

print_status() {
  git submodule foreach --quiet 'echo "$name: $(git rev-parse --short HEAD) on $(git branch --show-current)"'
}

if [ "$STATUS_ONLY" = true ]; then
  git submodule foreach --quiet 'git fetch origin 2>/dev/null || true'
  print_status
  exit 0
fi

echo "Syncing submodule configuration..."
git submodule sync --recursive

echo "Initializing submodules..."
git submodule update --init --recursive

echo "Updating submodules to latest main..."
git submodule update --remote --merge

echo "Checking out tracked branch in each submodule..."
git submodule foreach '
  branch="$(git config -f "$toplevel/.gitmodules" submodule."$name".branch)"
  branch="${branch:-main}"
  git checkout -B "$branch" "origin/$branch"
'

echo ""
echo "Submodule status:"
print_status

if [ "$COMMIT" = true ]; then
  if git diff --quiet -- resume-data-source portfolio cv-generator; then
    echo ""
    echo "No submodule pointer changes to commit."
  else
    git add resume-data-source portfolio cv-generator
    git commit -m "$(cat <<'EOF'
chore: update submodules
EOF
)"
    echo ""
    echo "Committed submodule pointer updates."
  fi
fi
