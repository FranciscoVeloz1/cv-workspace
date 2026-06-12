# CV Workspace

Meta-repository for Francisco's CV-related projects. Shared Cursor rules and scripts live here; project code lives in Git submodules.

## Submodules

| Submodule | Description |
|-----------|-------------|
| [resume-data-source](https://github.com/FranciscoVeloz1/resume-data-source) | JSON resume data and assets (experience, education, certifications, etc.) |
| [portfolio](https://github.com/FranciscoVeloz1/portfolio) | React + Vite portfolio site |
| [cv-generator](https://github.com/FranciscoVeloz1/cv-generator) | CV markdown templates and converter tooling |

## Getting started

Clone with submodules:

```bash
git clone --recurse-submodules <path-to-this-repo>
```

If you already cloned without submodules:

```bash
./scripts/update-submodules.sh
```

## Updating submodules

Pull the latest `main` branch for every submodule:

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
