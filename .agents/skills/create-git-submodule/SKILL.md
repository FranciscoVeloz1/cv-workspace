---
name: create-git-submodule
description: Initialize a folder as its own git repo, create a private GitHub remote with gh, and register it as a submodule of the parent repo. Use when turning a folder into a git submodule, bootstrapping a nested repo, or when the user asks to init a submodule / make a folder its own repo with a remote.
---

# Create Git Submodule

Turn a folder inside a parent git repo into a private GitHub repository and register it as a submodule.

**Defaults:** private remote; repo name = folder basename; commit child init and parent submodule registration.

Follow [gh](../gh/SKILL.md) for `gh` invocation (JSON flags, non-interactive create, auth).

## Preconditions

1. Confirm a **parent** git repo: `git rev-parse --show-toplevel` from the workspace (or the folder’s ancestor).
2. Resolve the target **folder path** (absolute or relative to parent root). Create the folder if the user asked for a new one.
3. Abort if the path is already a submodule (`git submodule status -- <path>` shows an entry) or is outside the parent work tree.
4. Confirm `gh` auth: `gh auth status`. Do not proceed without a logged-in account.

## Workflow

Copy and track:

```
Task Progress:
- [ ] 1. Resolve parent root, folder path, repo name
- [ ] 2. Init nested git repo + initial commit
- [ ] 3. Create private GitHub remote and push (gh)
- [ ] 4. Register folder as submodule in parent
- [ ] 5. Commit parent submodule registration
- [ ] 6. Report URLs and next steps
```

### 1. Resolve names

- `PARENT=$(git rev-parse --show-toplevel)`
- `FOLDER` = target directory (must live under `$PARENT`)
- `REPO_NAME` = basename of `FOLDER` (override only if the user gives `OWNER/REPO` or an explicit name)
- Prefer creating under the authenticated user: `REPO_NAME` alone. If the user names an org, use `org/$REPO_NAME`.

### 2. Init nested repo

From `$FOLDER`:

```bash
git init
git add .
git status
```

- If there are no files yet, create a minimal placeholder only when needed so the first commit is non-empty (e.g. `README.md` with the folder/repo name)—skip if the user already added content.
- Commit:

```bash
git commit -m "$(cat <<'EOF'
Initial commit.

EOF
)"
```

- If `git commit` fails because nothing is staged, stop and ask the user for content (or add the README as above if they want an empty scaffold).

Do **not** create the GitHub remote until the nested repo has at least one commit.

### 3. Create private remote and push

Still in `$FOLDER` (or pass `--source`):

```bash
gh repo create "$REPO_NAME" --private --source=. --remote=origin --push
```

- If the user specified `OWNER/REPO`, use that as the name argument instead of `$REPO_NAME`.
- Do not pass `--public` unless the user explicitly asks for a public repo.
- If `origin` already exists, do not recreate: verify the remote, then `git push -u origin HEAD` (or the current branch).
- Capture the URL:

```bash
gh repo view --json url,nameWithOwner --jq '{url: .url, nameWithOwner: .nameWithOwner}'
```

Also keep the fetch URL: `git remote get-url origin`.

### 4. Register as submodule in parent

`git submodule add` refuses an existing path. From `$PARENT`:

```bash
REMOTE_URL=$(git -C "$FOLDER" remote get-url origin)
TMP="${FOLDER}.__submodule_setup__"

# If parent tracks files under FOLDER, unstage/remove from index only (after push succeeded)
if git ls-files --error-unmatch "$FOLDER" >/dev/null 2>&1; then
  git rm -r --cached "$FOLDER"
fi

mv "$FOLDER" "$TMP"
git submodule add "$REMOTE_URL" "$FOLDER"
rm -rf "$TMP"
```

- If `git submodule add` fails, restore `$TMP` back to `$FOLDER` and report the error; do not leave the tree half-migrated.
- Prefer HTTPS or SSH to match the parent’s existing remotes (`git remote get-url origin` on the parent). Convert `REMOTE_URL` if needed so submodule URL style is consistent.

### 5. Commit parent registration

From `$PARENT`:

```bash
git add .gitmodules "$FOLDER"
git status
git commit -m "$(cat <<EOF
Add ${REPO_NAME} as a submodule.

EOF
)"
```

Only skip the parent commit if the user explicitly asked not to commit.

### 6. Report

Return:

- Nested repo: `nameWithOwner` and browser `url`
- Submodule path relative to parent
- Reminder: clones of the parent need `git submodule update --init --recursive`

## Edge cases

| Situation | Action |
|-----------|--------|
| Folder already has `.git` and `origin` | Skip init/create; push if ahead; continue from submodule registration |
| Remote name exists on GitHub | Stop; ask for a different name or whether to reuse the existing repo |
| Folder is the parent root | Abort — never turn the parent into a submodule of itself |
| User wants public | Use `--public` instead of `--private` |
| Nested repo on different default branch | After create/push, submodule add tracks the pushed commit; fine |

## Do not

- Force-push or `git push --force`
- Use `gh` interactively (always pass `--private`/`--public`, `--source`, `--remote`, `--push` as needed)
- Leave `*.__submodule_setup__` directories behind after success
- Commit secrets (`.env`, credentials); warn and exclude if present
