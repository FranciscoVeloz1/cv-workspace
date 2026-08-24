---
name: kanban-cli
description: Run the kanban-cli to list, create, update, move, and delete kanban tags and tasks via personal-api. Use when the user asks to manage the board, tags, or tasks (create, list, show, update, finish, delete), log in to kanban, or mentions the kanban CLI.
disable-model-invocation: true
---

# kanban-cli

Operate the user's kanban board **only** through `repos/kanban-cli`. Do not call `/api/v1/kanban` with raw `curl`/`fetch`. Do not edit `personal-api` or `kanban-dashboard` for board CRUD.

## Invoke

From the workspace root:

```bash
repos/kanban-cli/kanban <command> ...
```

The wrapper loads `repos/kanban-cli/.env` (`KANBAN_API_URL`, origin only, no `/api/v1`). Prefer this path over a bare `kanban` (PATH may be empty in the agent sandbox).

Shell needs:

- **Network** (`full_network` or `all`) to reach local `:3000` or Railway
- **`all`** if the session file is unreadable in the sandbox (`~/.config/kanban-cli/session.json`)

Do not print that session file. Do not commit `.env`.

`CORS_ORIGINS` is for browsers. The CLI does not need it.

## Auth

Mutations and lists require a session. If stderr is `Not logged in. Run: kanban login`:

1. Tell the user to run `kanban login --email <their-email>` **in their own terminal** (password prompt).
2. Do **not** pass `--password` (visible in `ps` and chat logs).
3. Do **not** invent credentials. Local `admin@example.com` is not prod unless that user exists on the API in `.env`.

`logout` only when the user asks.

## Names

Quote every name. Match is exact after trim, **case-sensitive**.

```bash
repos/kanban-cli/kanban create-tag 'Urgent'
repos/kanban-cli/kanban create-task 'Ship CLI' --description 'Write the skill' --tag 'Urgent' --deadline 2026-08-22
```

`--tag` is a **tag name**, not a UUID. `--id <uuid>` is only for show/update/delete when titles collide.

If stderr starts with `Multiple tasks named`: list the printed UUIDs, ask which one, re-run with `--id`.

Do not create a tag as a side effect of creating a task. If `--tag` 404s, ask or create the tag first **only if the user wants that**.

## Commands

```
login --email <email>          # user runs this locally; agent does not
logout
list-tags
create-tag <name>
delete-tag <name>              # [--id]
list-tasks [--status <status>]
show-task <title>              # [--id]; prints line + description
create-task <title> --description <text> [--tag <name>] [--deadline YYYY-MM-DD] [--checklist <item>]
update-task <title>            # at least one field flag; [--id]
delete-task <title>            # [--id]
```

`update-task` flags: `--title` `--description` `--status` `--tag` `--deadline` `--clear-tag` `--clear-deadline` `--checklist`. Repeat `--checklist` once per item. Do not combine `--tag` with `--clear-tag`, or `--deadline` with `--clear-deadline`.

Status values: `PENDING`, `IN_PROGRESS`, `FINISHED` (also `pending`, `in-progress`, `finished`).

Move a card = `update-task '<title>' --status IN_PROGRESS` (or `FINISHED` / `PENDING`).

`create-task` requires `--description`. If the user omitted it, ask; do not invent body text.

Put pending work in `--checklist`, not as markdown in `--description`. The dashboard checklist UI only reads the API `checklist` field.

There is no tag rename (API has no tag PATCH). No `--json`.

## Agent workflow

1. For "what's on the board" / "list X": `list-tasks` and/or `list-tags`. Optional `--status`.
2. For create/update/delete: run the verb. Report stdout. On failure, report stderr; do not retry blindly.
3. After a write, do not spam a full re-list unless the user wants confirmation or the output is ambiguous.
4. Destructive (`delete-tag`, `delete-task`): run when the user asked to delete that named resource. If the name might be wrong, `list-*` first.
5. Network errors (`Could not reach the server`): say which origin is in `KANBAN_API_URL` (read `.env`, do not dump other files) and that the API must be up.

## Output

Tag list: one name per line.

Task list: `STATUS  title  [tag]  [YYYY-MM-DD]`

Relay that text. Do not reformat into a fake table unless the user asks.
