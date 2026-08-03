# Plan de alimentación (dataset)

Static meal-plan dataset for web apps. Recipes, day menus, and general recommendations are structured in JSON; scanned source sheets live under `images/`.

**Out of scope:** UI application, auth, or backend.

## Layout

```
recipe-app/
├── index.json          # Structured dataset (consume this)
├── README.md
├── images/             # Source scans (reference only)
│   ├── IMG_4049.png    # Menús 1–3
│   ├── IMG_4050.png    # Recomendaciones
│   ├── IMG_4051.png    # Menús 4–6
│   └── IMG_4052.png    # Menús 7–9
└── docs/superpowers/   # Design + implementation plan
```

## Conventions

- **Anonymous:** no patient name or other PII
- **Locale:** Spanish content (`es-MX`), English JSON keys
- **Images:** paths are relative to this folder (e.g. `images/IMG_4049.png`)
- **Units:** as on the sheets (`pz`, `taza`, `gr`, `reb`, `cda`, `vaso`, `puñito`, `trocito`, or `null`)
- **Drinks:** meal pairings use slot-level `drink` strings; green-juice ingredients sit on the breakfast recipe with `notes: "jugo verde"`

The PNGs are source scans. Prefer `index.json` as the product for apps.

## Schema

Top-level keys in `index.json`:

| Key | Description |
|-----|-------------|
| `version` | Dataset semver string |
| `meta` | Title, locale, source clinic, and `mealSlots` definitions |
| `recommendations` | Array of guideline strings |
| `recipes` | Dish/snack catalog (source of truth) |
| `menus` | Nine day-menus that reference recipes by slot |

### `meta.mealSlots`

| id | label | time |
|----|-------|------|
| `desayuno` | Desayuno | 9:00am |
| `colacion_1` | Colación | 12:00pm |
| `comida` | Comida | 3:00 / 4:00pm |
| `colacion_2` | Colación | 6:00pm |
| `cena` | Cena | 8-9pm |

### Recipe

```ts
{
  id: string              // kebab-case slug
  name: string
  mealTypes: string[]     // meal slot ids
  ingredients: {
    item: string
    quantity: number | string | null
    unit: string | null
    notes: string | null
  }[]
  sides: string[]
  drink: string | null    // rarely used; prefer menu slot drink
  instructions: string[]
  sourceImage: string     // relative path into images/
}
```

### Menu

```ts
{
  id: string              // menu-1 … menu-9
  label: string
  sourceImage: string
  row: 1 | 2 | 3          // row on the source sheet
  slots: {
    [mealSlotId]: {
      recipeId: string
      drink?: string
    }
  }
}
```

Menu mapping:

- `menu-1` … `menu-3` ← `images/IMG_4049.png`
- `menu-4` … `menu-6` ← `images/IMG_4051.png`
- `menu-7` … `menu-9` ← `images/IMG_4052.png`
- Recommendations ← `images/IMG_4050.png`

## Using in a web app

Resolve a day’s meals by loading a menu and joining each `recipeId`:

```js
const data = await fetch("/index.json").then((r) => r.json());

const recipesById = Object.fromEntries(
  data.recipes.map((recipe) => [recipe.id, recipe])
);

function resolveMenu(menuId) {
  const menu = data.menus.find((m) => m.id === menuId);
  if (!menu) return null;

  const meals = {};
  for (const [slotId, slot] of Object.entries(menu.slots)) {
    meals[slotId] = {
      ...slot,
      recipe: recipesById[slot.recipeId],
    };
  }
  return { menu, meals, recommendations: data.recommendations };
}

const day = resolveMenu("menu-1");
// day.meals.desayuno.recipe.name → "Omelette con champiñones"
// day.meals.desayuno.drink → "Jugo verde"
```

Serve `index.json` and `images/` as static assets (same origin or CDN). Image URLs in the dataset are relative; prefix with your static base path as needed.

## Source note

Sheets come from a personalized clinical meal plan. The JSON omits patient identity. The printed disclaimer on the recommendations sheet is not copied into the dataset; treat the content as personal nutrition guidance, not general medical advice.
