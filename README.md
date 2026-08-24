# CV Workspace

Meta-repository for Francisco's CV-related projects. Shared Cursor rules and scripts live at the workspace root; project code lives in Git submodules under `repos/<category>/`.

## Layout

```
cv-workspace/
├── .agents/          # Shared Cursor rules and skills
├── scripts/          # Submodule maintenance scripts
└── repos/
    ├── docs/                 # Reference / notes
    ├── templates/            # Starter templates
    ├── productive-apps/      # personal-api and its client apps
    ├── utils/                # Converter / generator / scraper CLIs
    └── personal-projects/    # Everything else
```

Workspace `docs/` (plans, architecture) is **not** a submodule folder. Submodule docs live in `repos/docs/`.

## Submodules

### docs

| Submodule | Description |
|-----------|-------------|
| [js-arrays-methods](https://github.com/FranciscoVeloz1/js-arrays-methods) | JS arrays methods reference |

### templates

| Submodule | Description |
|-----------|-------------|
| [React-Next-Dashboard](https://github.com/FranciscoVeloz1/React-Next-Dashboard) | Next.js dashboard template (BoxBook, Lab Maintenance, Stack Questions) |
| [react-node-template](https://github.com/FranciscoVeloz1/react-node-template) | React + Node.js REST API monorepo template |

### productive-apps

`personal-api` plus client repos for its modules (`users`, `fitness`, `finance`, `groceries`, `kanban`).

| Submodule | Description |
|-----------|-------------|
| [personal-api](https://github.com/FranciscoVeloz1/personal-api) | Shared platform REST API |
| [user-management-app](https://github.com/FranciscoVeloz1/user-management-app) | User management SPA (`users` module) |
| [fitness-nutrition-tracker](https://github.com/FranciscoVeloz1/fitness-nutrition-tracker) | Fitness / nutrition SPA (`fitness` module) |
| [finance-app](https://github.com/FranciscoVeloz1/finance-app) | Finance SPA (`finance` module) |
| [full-groceries-app](https://github.com/FranciscoVeloz1/full-groceries-app) | Groceries SPA (`groceries` module) |
| [kanban-dashboard](https://github.com/FranciscoVeloz1/kanban-dashboard) | Kanban SPA (`kanban` module) |
| [kanban-cli](https://github.com/FranciscoVeloz1/kanban-cli) | Kanban CLI (`kanban` module) |

### utils

| Submodule | Description |
|-----------|-------------|
| [cv-generator](https://github.com/FranciscoVeloz1/cv-generator) | CV markdown templates and converter tooling |
| [pdf-to-png](https://github.com/FranciscoVeloz1/pdf-to-png) | PDF page to PNG CLI |
| [heic-to-png](https://github.com/FranciscoVeloz1/heic-to-png) | HEIC to PNG CLI |
| [slides-generator](https://github.com/FranciscoVeloz1/slide-generator) | Slide deck generator |
| [job-scraper-cli](https://github.com/FranciscoVeloz1/job-scraper-cli) | Public remote-job scraper CLI |

### personal-projects

Showcase projects linked from `repos/personal-projects/resume-data-source/index.json`, plus other local-dev repos.

| Submodule | Description |
|-----------|-------------|
| [resume-data-source](https://github.com/FranciscoVeloz1/resume-data-source) | JSON resume data and assets |
| [portfolio](https://github.com/FranciscoVeloz1/portfolio) | React + Vite portfolio site |
| [rn-speed-art](https://github.com/FranciscoVeloz1/rn-speed-art) | React Native design library |
| [Mettaton-compiler](https://github.com/FranciscoVeloz1/Mettaton-compiler) | Robotics programming language and compiler |
| [Smart-house](https://github.com/FranciscoVeloz1/Smart-house) | IoT smart home platform |
| [mintel](https://github.com/FranciscoVeloz1/mintel) | Smart House landing page |
| [car-history-app](https://github.com/FranciscoVeloz1/car-history-app) | Vehicle history tracking app |
| [groceries-app](https://github.com/FranciscoVeloz1/groceries-app) | Older groceries list app (not the API SPA) |
| [screen-recorder](https://github.com/FranciscoVeloz1/screen-recorder) | Screen recorder |
| [arqueologIA-api](https://github.com/FranciscoVeloz1/arqueologIA-api) | Archaeology AI API |
| [greed-island-card-api](https://github.com/FranciscoVeloz1/greed-island-card-api) | Greed Island Card Lists API |
| [boda-app](https://github.com/FranciscoVeloz1/boda-app) | Wedding app |
| [NexaRize-Components](https://github.com/FranciscoVeloz1/NexaRize-Components) | React components made by NexaRize |
| [nexa-components-test](https://github.com/FranciscoVeloz1/nexa-components-test) | NexaRize components test app |
| [NexaRize-Electric-car](https://github.com/FranciscoVeloz1/NexaRize-Electric-car) | Open-source electric vehicle project |
| [mettaton-v2](https://github.com/FranciscoVeloz1/mettaton-v2) | Mettaton compiler V2 |
| [recipe-app](https://github.com/FranciscoVeloz1/recipe-app) | Recipe app |

Older files under workspace `docs/plans/` still say `repos/<name>`. Treat those as historical; live checkouts are `repos/<category>/<name>`.

## Getting started

Clone with submodules:

```bash
git clone --recurse-submodules git@github.com:FranciscoVeloz1/cv-workspace.git
```

If you already cloned without submodules:

```bash
./scripts/update-submodules.sh
```

## Updating submodules

Pull the latest tracked branch for every submodule:

```bash
./scripts/update-submodules.sh
```

Limit to one category folder (`docs`, `templates`, `productive-apps`, `utils`, `personal-projects`):

```bash
./scripts/update-submodules.sh docs
./scripts/update-submodules.sh --status productive-apps
```

Show current submodule status without updating:

```bash
./scripts/update-submodules.sh --status
```

Stage and commit submodule pointer updates in the parent repo:

```bash
./scripts/update-submodules.sh --commit
```

PowerShell equivalents: `./scripts/update-submodules.ps1`, `./scripts/update-submodules.ps1 -Status docs`, `./scripts/update-submodules.ps1 -Commit`.

## Migrating an existing clone

If you cloned when every submodule sat directly under `repos/<name>`:

```bash
git pull
git submodule sync --recursive
git submodule update --init --recursive
```

If Git left empty directories at the old flat paths, remove those empty dirs only (not the new `repos/<category>/` trees):

```bash
find repos -mindepth 1 -maxdepth 1 -type d ! -name docs ! -name templates ! -name productive-apps ! -name utils ! -name personal-projects -empty -delete
```

Then run `./scripts/check-submodule-layout.sh` — it must print `OK: 32 submodules under repos/<category>/<name>`.
