# CV Workspace

Meta-repository for Francisco's CV-related projects. Shared Cursor rules and scripts live at the workspace root; project code lives in Git submodules under `repos/`.

## Layout

```
cv-workspace/
├── .cursor/          # Shared Cursor rules and skills
├── scripts/          # Submodule maintenance scripts
└── repos/            # All project submodules (20 repos)
    ├── resume-data-source/
    ├── portfolio/
    ├── cv-generator/
    └── …
```

## Submodules

| Submodule | Description |
|-----------|-------------|
| [resume-data-source](https://github.com/FranciscoVeloz1/resume-data-source) | JSON resume data and assets (experience, education, certifications, etc.) |
| [portfolio](https://github.com/FranciscoVeloz1/portfolio) | React + Vite portfolio site |
| [cv-generator](https://github.com/FranciscoVeloz1/cv-generator) | CV markdown templates and converter tooling |

### Showcase projects

These repos are linked from `repos/resume-data-source/index.json` and included as submodules for local development:

| Submodule | Description |
|-----------|-------------|
| [rn-speed-art](https://github.com/FranciscoVeloz1/rn-speed-art) | React Native design library |
| [react-node-template](https://github.com/FranciscoVeloz1/react-node-template) | React + Node.js REST API monorepo template |
| [React-Next-Dashboard](https://github.com/FranciscoVeloz1/React-Next-Dashboard) | Next.js dashboard (BoxBook, Lab Maintenance, Stack Questions) |
| [Mettaton-compiler](https://github.com/FranciscoVeloz1/Mettaton-compiler) | Robotics programming language and compiler |
| [Smart-house](https://github.com/FranciscoVeloz1/Smart-house) | IoT smart home platform |
| [mintel](https://github.com/FranciscoVeloz1/mintel) | Smart House landing page |

### Other projects

Additional repos included as submodules for local development:

| Submodule | Description |
|-----------|-------------|
| [car-history-app](https://github.com/FranciscoVeloz1/car-history-app) | Vehicle history tracking app |
| [groceries-app](https://github.com/FranciscoVeloz1/groceries-app) | Groceries list app |
| [full-groceries-app](https://github.com/FranciscoVeloz1/full-groceries-app) | Full groceries list app (GitHub Pages) |
| [js-arrays-methods](https://github.com/FranciscoVeloz1/js-arrays-methods) | JS arrays methods reference |
| [screen-recorder](https://github.com/FranciscoVeloz1/screen-recorder) | Screen recorder |
| [arqueologIA-api](https://github.com/FranciscoVeloz1/arqueologIA-api) | Archaeology AI API |
| [greed-island-card-api](https://github.com/FranciscoVeloz1/greed-island-card-api) | Greed Island Card Lists API |
| [boda-app](https://github.com/FranciscoVeloz1/boda-app) | Wedding app |
| [NexaRize-Components](https://github.com/FranciscoVeloz1/NexaRize-Components) | React components made by NexaRize |
| [nexa-components-test](https://github.com/FranciscoVeloz1/nexa-components-test) | NexaRize components test app |
| [NexaRize-Electric-car](https://github.com/FranciscoVeloz1/NexaRize-Electric-car) | Open-source electric vehicle project (Node.js + React) |
| [mettaton-v2](https://github.com/FranciscoVeloz1/mettaton-v2) | Mettaton compiler V2 |

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

Pull the latest tracked branch for every submodule in `repos/`:

```bash
./scripts/update-submodules.sh
```

Show current submodule status without updating:

```bash
./scripts/update-submodules.sh --status
```

Stage and commit submodule pointer updates in the parent repo:

```bash
./scripts/update-submodules.sh --commit
```

## Migrating an existing clone

If you cloned before submodules moved under `repos/`:

```bash
git pull
git submodule sync --recursive
git submodule update --init --recursive
```
