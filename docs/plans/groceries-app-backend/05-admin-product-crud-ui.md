# Admin Product CRUD UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a groceries-app ADMIN-only product management UI in `full-groceries-app` for create, edit, and delete against `personal-api`, with category selection from `GET /categories`, using **mobile-first icon actions**.

**Architecture:** `/admin/products` behind `RequireAdmin` (`isGroceriesAdmin`). Mutations via TanStack Query calling groceries API. READ_ONLY groceries users see no admin nav and go to `/forbidden` on direct URL. No category admin screens. CRUD controls are icon buttons sized for touch (not desktop text links).

**Tech Stack:** React 19, react-router-dom, TanStack Query, `lucide-react` (admin action icons), personal-api groceries module.

---

## Scope and dependencies

- **Depends on:** [04 — Router, login, and catalog UI](04-router-login-and-catalog-ui.md).
- **Unblocks:** [06 — Groceries E2E](06-groceries-e2e.md).
- **Does not include:** Category create/edit/delete UI, trip/shopping admin, bulk import UI.

## Files

- Create: `repos/full-groceries-app/src/auth/RequireAdmin.tsx`
- Create: `repos/full-groceries-app/src/pages/AdminProductsPage.tsx`
- Create: `repos/full-groceries-app/src/hooks/useProductMutations.ts`
- Create: `repos/full-groceries-app/src/components/IconButton.tsx` (or `IconButton/index.tsx`) — shared touch-friendly icon control
- Modify: `repos/full-groceries-app/src/api/groceries.ts` — create/patch/delete
- Modify: `repos/full-groceries-app/src/App.tsx` — admin routes
- Modify: header/nav — Admin entry only when `isGroceriesAdmin` (icon preferred; see Nav)
- Modify: `repos/full-groceries-app/package.json` — add `lucide-react`

## API client additions

```ts
createProduct(request, body: {
  name: string
  image?: string
  categoryId: string
  price: number
}) → POST /api/v1/groceries/products

updateProduct(request, id, body: Partial<{
  name: string
  image: string
  categoryId: string
  price: number
}>) → PATCH /api/v1/groceries/products/:id

deleteProduct(request, id) → DELETE /api/v1/groceries/products/:id
```

## Auth guard

```tsx
// Inside RequireAuth
// if !isGroceriesAdmin → <Navigate to="/forbidden" replace />
// else <Outlet />
```

```tsx
<Route element={<RequireAuth />}>
  {/* catalog routes */}
  <Route element={<RequireAdmin />}>
    <Route path="/admin/products" element={<AdminProductsPage />} />
  </Route>
</Route>
```

## Mobile-first icon actions (locked)

Install `lucide-react`. Use an `IconButton` wrapper:

```tsx
type IconButtonProps = {
  label: string // required accessible name
  onClick: () => void
  children: React.ReactNode // lucide icon
  tone?: 'default' | 'danger'
  disabled?: boolean
  type?: 'button' | 'submit'
}

// CSS: min-width/min-height 44px; padding so icon ~20–24px; no reliance on visible text
<button type={type ?? 'button'} aria-label={label} title={label} className={...} ...>
  {children}
</button>
```

| Action | Lucide icon | `aria-label` (Spanish, lock) |
| --- | --- | --- |
| Open create form / add product | `Plus` | `Agregar producto` |
| Edit row | `Pencil` | `Editar producto` |
| Delete row | `Trash2` | `Eliminar producto` |
| Confirm delete (dialog primary) | `Trash2` or `Check` | `Confirmar eliminar` |
| Cancel dialog / dismiss form | `X` | `Cancelar` |
| Save create/edit form | `Check` | `Guardar producto` |

Rules:

- List row actions are **icon-only** (edit + delete). Do not use “Editar” / “Eliminar” text buttons as the primary control.
- Page header “add” is **icon-only** (`Plus`), not a full-width “Nuevo producto” text button (optional short caption under the icon is OK if it does not replace `aria-label`).
- Form submit / cancel in the create-edit sheet or dialog are icon buttons (`Check` / `X`) with the labels above; do not require reading long English/Spanish button strings to act.
- Touch target ≥ **44×44 CSS px**; icons ~20–24px; adequate spacing between edit and delete so they are not fat-fingered.
- `tone: 'danger'` for delete (and confirm delete) — use existing Mandado danger/red token if present.
- Visible text may still appear for **field labels**, errors, empty states, and confirm dialog copy (“¿Eliminar este producto?”) — only **actions** are icon-first.

## AdminProductsPage UX

- Product list (mobile: stacked rows). Each row: name, price, category name; trailing **icon** edit + delete.
- **Create:** tap header `Plus` → form (sheet/dialog/inline): name, image, price, category `<select>` from `useCategoriesQuery()`. Save via `Check` icon; cancel via `X`.
- **Edit:** tap `Pencil` → same form prefilled; save via `Check`.
- **Delete:** tap `Trash2` → confirm dialog with short text + icon confirm/cancel; then DELETE; invalidate `groceryKeys.all`.
- Loading / error / success as compact status text (not toast library required).

## Nav

- Admin entry when `isGroceriesAdmin`: prefer icon (`Package` or `Settings2`) with `aria-label="Administrar productos"` linking to `/admin/products`. Text label optional beside icon on wide screens only; on narrow viewports **icon-only** is enough.
- READ_ONLY: entry hidden; `/admin/products` → `/forbidden`.

### Task 1: API mutations + IconButton + hooks

- [ ] `npm install lucide-react`
- [ ] Add create/patch/delete to `groceries.ts`.
- [ ] Implement `IconButton` with required `label` + 44px target.
- [ ] `useProductMutations` with query invalidation.

### Task 2: RequireAdmin + AdminProductsPage

- [ ] Guard, page (icon CRUD UX as locked), routes, admin nav icon.
- [ ] `npm run lint && npx tsc -b --noEmit && npm run build`.

### Task 3: Playwright E2E

Users:

- ADMIN: `groceries.admin@example.com` / `password123` with `groceries-app` ADMIN
- READ_ONLY: `groceries.user@example.com` / `password123`

Target controls by **accessible name** (icons):

```bash
playwright-cli open "http://localhost:5173/full-groceries-app/login"
# login as groceries.admin@example.com
playwright-cli click <adminNavRef>   # aria-label Administrar productos

playwright-cli click <addRef>        # aria-label Agregar producto
playwright-cli fill <nameRef> "E2E Detergente"
playwright-cli fill <priceRef> "45"
playwright-cli select <categoryRef> "Limpieza global"
playwright-cli click <saveRef>       # aria-label Guardar producto

playwright-cli goto "http://localhost:5173/full-groceries-app/"
playwright-cli click <limpiezaGlobalRef>
# Expect E2E Detergente

playwright-cli goto "http://localhost:5173/full-groceries-app/admin/products"
playwright-cli click <editRef>       # aria-label Editar producto (for E2E row)
playwright-cli fill <priceRef> "49"
playwright-cli click <saveRef>

playwright-cli click <deleteRef>     # aria-label Eliminar producto
playwright-cli click <confirmRef>    # aria-label Confirmar eliminar

# READ_ONLY: /admin/products → forbidden; no admin icon in nav
```

### Task 4: Commit

```bash
git add .
git commit -m "$(cat <<'EOF'
feat: add mobile icon admin product CRUD against personal-api

EOF
)"
```

## Verification / E2E (this spec)

- [ ] groceries-app ADMIN can CRUD products via icon actions; catalog updates via query invalidation.
- [ ] Every CRUD action control has an `aria-label` from the locked Spanish set; hit area ≥ 44px.
- [ ] Category select lists seeded API categories.
- [ ] groceries-app READ_ONLY cannot open admin.
- [ ] Playwright flows use accessible names (not visible “Editar” text).
- [ ] No category admin UI.
