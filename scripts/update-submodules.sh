#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STATUS_ONLY=false
COMMIT=false
FOLDER=""
VALID_FOLDERS=(docs templates productive-apps utils personal-projects)

usage() {
  echo "Usage: $0 [--status] [--commit] [folder]"
  echo "  --status  Show submodule SHAs/branches without updating"
  echo "  --commit  Commit submodule pointer updates in the parent repo"
  echo "  folder    Limit to repos/<folder>/ : ${VALID_FOLDERS[*]}"
}

is_valid_folder() {
  local candidate="$1"
  local f
  for f in "${VALID_FOLDERS[@]}"; do
    if [[ "$f" == "$candidate" ]]; then
      return 0
    fi
  done
  return 1
}

for arg in "$@"; do
  case "$arg" in
    --status)
      STATUS_ONLY=true
      ;;
    --commit)
      COMMIT=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if is_valid_folder "$arg"; then
        if [[ -n "$FOLDER" ]]; then
          echo "Only one folder argument allowed" >&2
          exit 1
        fi
        FOLDER="$arg"
      else
        echo "Unknown option: $arg" >&2
        usage >&2
        exit 1
      fi
      ;;
  esac
done

list_paths() {
  local path
  while IFS= read -r path; do
    if [[ -n "$FOLDER" && "$path" != repos/"$FOLDER"/* ]]; then
      continue
    fi
    printf '%s\n' "$path"
  done < <(git config -f .gitmodules --get-regexp '^submodule\..*\.path$' | awk '{print $2}')
}

mapfile -t SUBMODULE_PATHS < <(list_paths)

if [[ ${#SUBMODULE_PATHS[@]} -eq 0 ]]; then
  echo "No submodule paths matched${FOLDER:+ in repos/$FOLDER/}." >&2
  exit 1
fi

print_status() {
  local path
  for path in "${SUBMODULE_PATHS[@]}"; do
    git -C "$path" rev-parse --is-inside-work-tree >/dev/null
    echo "$path: $(git -C "$path" rev-parse --short HEAD) on $(git -C "$path" branch --show-current)"
  done
}

if [ "$STATUS_ONLY" = true ]; then
  for path in "${SUBMODULE_PATHS[@]}"; do
    git -C "$path" fetch origin 2>/dev/null || true
  done
  print_status
  exit 0
fi

echo "Syncing submodule configuration..."
git submodule sync --recursive

echo "Initializing matched submodules..."
git submodule update --init --recursive -- "${SUBMODULE_PATHS[@]}"

echo "Updating matched submodules to latest tracked branch..."
git submodule update --remote --merge -- "${SUBMODULE_PATHS[@]}"

echo "Checking out tracked branch in each matched submodule..."
for path in "${SUBMODULE_PATHS[@]}"; do
  name="$(git config -f .gitmodules --get-regexp '^submodule\..*\.path$' | awk -v p="$path" '$2==p {print $1}' | sed 's/^submodule\.//; s/\.path$//')"
  branch="$(git config -f .gitmodules --get "submodule.${name}.branch" || true)"
  branch="${branch:-main}"
  git -C "$path" checkout -B "$branch" "origin/$branch"
done

echo ""
echo "Submodule status:"
print_status

if [ "$COMMIT" = true ]; then
  if git diff --quiet -- "${SUBMODULE_PATHS[@]}"; then
    echo ""
    echo "No submodule pointer changes to commit."
  else
    git add -- "${SUBMODULE_PATHS[@]}"
    git commit -m "$(cat <<'EOF'
chore: update submodules
EOF
)"
    echo ""
    echo "Committed submodule pointer updates."
  fi
fi
