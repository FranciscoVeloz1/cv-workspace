# Recipe App JSON Design

**Date:** 2026-08-03  
**Status:** Approved

## Goal

Provide a static, web-ready meal-plan dataset in `index.json`, transcribed from scanned plan sheets in `images/`. Building a UI application is out of scope.

## Approach

Hybrid model:

- `recipes[]` — source of truth for dishes and snacks (stable `id` slugs)
- `menus[]` — nine day-menus (3 sheets × 3 rows) that reference recipes by meal slot
- `recommendations[]` — ten general guidelines from the recommendations sheet

## Privacy

Anonymous dataset. Do not include patient name or other PII. Clinic may appear only as `meta.source` (`en forma salud y nutrición`).

## Conventions

- Spanish content (`locale: es-MX`), English JSON keys
- Relative image paths from the recipe-app root (e.g. `images/IMG_4049.png`)
- Duplicate dish titles with different ingredients get separate recipe IDs
- Simple snacks (fruit, gelatina) are recipes so every menu slot uses `recipeId`
- Slot-level `drink` is a plain string for meal pairings
- Green-juice components on breakfast recipes use ingredient `notes: "jugo verde"`; slot drink is `"Jugo verde"`

## Image → menu mapping

| Menus | Source image | Role |
|-------|--------------|------|
| menu-1 … menu-3 | `images/IMG_4049.png` | Meal grid rows 1–3 |
| — | `images/IMG_4050.png` | Recommendations only |
| menu-4 … menu-6 | `images/IMG_4051.png` | Meal grid rows 1–3 |
| menu-7 … menu-9 | `images/IMG_4052.png` | Meal grid rows 1–3 |

## Meal slots

| id | label | time |
|----|-------|------|
| desayuno | Desayuno | 9:00am |
| colacion_1 | Colación | 12:00pm |
| comida | Comida | 3:00 / 4:00pm |
| colacion_2 | Colación | 6:00pm |
| cena | Cena | 8-9pm |

## Schema summary

Top-level: `version`, `meta`, `recommendations`, `recipes`, `menus`.

Recipe fields: `id`, `name`, `mealTypes`, `ingredients[{item,quantity,unit,notes}]`, `sides`, `drink`, `instructions`, `sourceImage`.

Menu fields: `id`, `label`, `sourceImage`, `row`, `slots` keyed by meal slot id with `{ recipeId, drink? }`.

## Deliverables

- `index.json` — full dataset
- `README.md` — schema and usage for web consumers
- Source PNGs remain in `images/` unchanged
