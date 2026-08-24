#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

declare -A EXPECTED=(
  [js-arrays-methods]=docs
  [React-Next-Dashboard]=templates
  [personal-api]=productive-apps
  [user-management-app]=productive-apps
  [fitness-nutrition-tracker]=productive-apps
  [finance-app]=productive-apps
  [full-groceries-app]=productive-apps
  [kanban-dashboard]=productive-apps
  [kanban-cli]=productive-apps
  [pdf-to-png]=utils
  [heic-to-png]=utils
  [slides-generator]=utils
  [job-scraper-cli]=utils
  [cv-generator]=utils
  [resume-data-source]=personal-projects
  [portfolio]=personal-projects
  [rn-speed-art]=personal-projects
  [react-node-template]=personal-projects
  [Mettaton-compiler]=personal-projects
  [Smart-house]=personal-projects
  [mintel]=personal-projects
  [car-history-app]=personal-projects
  [groceries-app]=personal-projects
  [screen-recorder]=personal-projects
  [arqueologIA-api]=personal-projects
  [greed-island-card-api]=personal-projects
  [boda-app]=personal-projects
  [NexaRize-Components]=personal-projects
  [NexaRize-Electric-car]=personal-projects
  [mettaton-v2]=personal-projects
  [nexa-components-test]=personal-projects
  [recipe-app]=personal-projects
)

fail=0
seen_names=()

while read -r key path; do
  name="${path##*/}"
  seen_names+=("$name")

  if [[ -z "${EXPECTED[$name]+x}" ]]; then
    echo "UNEXPECTED submodule path (no mapping): $path"
    fail=1
    continue
  fi

  want="repos/${EXPECTED[$name]}/$name"
  if [[ "$path" != "$want" ]]; then
    echo "MISMATCH $name: got $path want $want"
    fail=1
  fi
done < <(git config -f .gitmodules --get-regexp '^submodule\..*\.path$' | awk '{print $1, $2}')

for name in "${!EXPECTED[@]}"; do
  found=0
  for seen in "${seen_names[@]}"; do
    if [[ "$seen" == "$name" ]]; then
      found=1
      break
    fi
  done
  if [[ "$found" -eq 0 ]]; then
    echo "MISSING submodule: $name (expected repos/${EXPECTED[$name]}/$name)"
    fail=1
  fi
done

if [[ "${#seen_names[@]}" -ne "${#EXPECTED[@]}" ]]; then
  echo "COUNT mismatch: gitmodules names=${#seen_names[@]} expected=${#EXPECTED[@]}"
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "OK: ${#EXPECTED[@]} submodules under repos/<category>/<name>"
