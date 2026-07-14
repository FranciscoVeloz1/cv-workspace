# Priced Shopping and History UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** For groceries ADMIN users, replace spreadsheet fill-in with an in-app shopping session that mirrors the Excel “Lista de Mandado” layout (including **Precio Real**), persists draft trips via the API, completes them into history, and lists past groceries.

**Architecture:** Admin shopping builds or resumes a DRAFT `GroceryTrip`. Items are grouped by category like `exportToExcel.ts`. List price comes from catalog/cart snapshot; real price is editable per line. Completing the trip freezes items. Guests keep Excel export on `CartPage` unchanged. Admins may still use guest cart for browse-and-add, then “Start shopping session” maps cart → `POST /trips`.

**Tech Stack:** React 19, existing CSS modules, groceries API client from spec 03.

---

## Scope and dependencies

- **Depends on:** [04 — Admin gate and product CRUD UI](04-admin-gate-and-product-crud-ui.md) and [02 — Groceries API module](02-groceries-api-module.md).
- **Unblocks:** [06 — Groceries E2E](06-groceries-e2e.md).
- **Does not include:** Guest Excel changes, Category CRUD, multi-user trip sharing.

## Files

- Create: `repos/full-groceries-app/src/pages/AdminShoppingPage.tsx`
- Create: `repos/full-groceries-app/src/pages/AdminShoppingPage.module.css`
- Create: `repos/full-groceries-app/src/pages/AdminHistoryPage.tsx`
- Create: `repos/full-groceries-app/src/pages/AdminHistoryPage.module.css`
- Create: `repos/full-groceries-app/src/pages/AdminHistoryDetailPage.tsx` (or detail as nested state inside history page — prefer **one page with selectedTripId state** to avoid extra View variants)
- Create: `repos/full-groceries-app/src/hooks/useAdminTrips.ts`
- Create: `repos/full-groceries-app/src/utils/groupTripItemsByCategory.ts`
- Create: `repos/full-groceries-app/src/utils/tripTotals.ts`
- Modify: `repos/full-groceries-app/src/App.tsx` (wire admin-shopping / admin-history)
- Modify: `repos/full-groceries-app/src/pages/CartPage.tsx` — when `isGroceriesAdmin`, add CTA **“Iniciar mandado (precios reales)”** that creates a trip from current cart then navigates to admin-shopping (guest export buttons remain)
- Modify: `repos/full-groceries-app/src/components/AdminNav.tsx` (ensure Shopping / History navigate correctly)

## UX contracts

### Admin shopping session (Excel-equivalent)

Columns per item row:

| Producto | Cantidad | Precio | Total | Precio Real |
|----------|----------|--------|-------|-------------|
| name | qty controls | listPrice | listPrice×qty | number input |

- Group by category with category header + subtotal (list) and subtotal (real, summing entered real prices × qty — if realPrice null, exclude from real subtotal or treat as 0; prefer **exclude nulls from real subtotal**, show “—”).
- Footer: list TOTAL and real TOTAL.
- Actions:
  - **Save draft** → `PUT /trips/:id/items` (debounce optional; explicit Save button required).
  - **Complete mandado** → confirm → `POST /trips/:id/complete` → navigate history detail.
  - **Add custom item** → category 5, `productId: null`.
  - Resume: on entering admin-shopping, if a DRAFT exists (`listTrips('DRAFT')`), open the newest; else show empty state with “Create from cart” or create empty draft.

### Cart → trip mapping

```ts
function cartToTripItems(items: CartItem[]): CreateTripItemInput[] {
  return items.map((item, index) => ({
    productId: null, // guest Product.id is number; admin cart may mix — see rule below
    name: item.product.name,
    category: item.product.category,
    quantity: item.quantity,
    listPrice: item.product.price,
    realPrice: null,
    sortOrder: index
  }))
}
```

**Fixed rule for v1:** When creating a trip from the **guest cart** (numeric product ids), always send `productId: null` and denormalize `name` / `category` / `listPrice` (snapshots). When adding lines from **admin catalog** (`ApiProduct`), set `productId` to the UUID.

Optional enhancement (same spec): if admin replaced `useProducts` only in admin shell, provide “Add from catalog” on shopping page calling `listProducts` — include this **Add from catalog** control on AdminShoppingPage so trips can link UUIDs without depending on guest cart.

### History

- List COMPLETED trips: completedAt, item count, list total, real total.
- Detail: read-only Excel-like table (no inputs).
- Delete completed trip allowed (calls `DELETE /trips/:id`) with confirm.

### Totals helpers

```ts
// utils/tripTotals.ts
export function lineListTotal(item: { listPrice: number; quantity: number }): number {
  return item.listPrice * item.quantity
}

export function lineRealTotal(item: {
  realPrice: number | null
  quantity: number
}): number | null {
  if (item.realPrice === null || item.realPrice === undefined) {
    return null
  }
  return item.realPrice * item.quantity
}

export function sumList(items: Array<{ listPrice: number; quantity: number }>): number {
  return items.reduce((sum, item) => sum + lineListTotal(item), 0)
}

export function sumReal(
  items: Array<{ realPrice: number | null; quantity: number }>
): number {
  return items.reduce((sum, item) => {
    const line = lineRealTotal(item)
    return line === null ? sum : sum + line
  }, 0)
}
```

```ts
// utils/groupTripItemsByCategory.ts
export function groupTripItemsByCategory<T extends { category: number }>(
  items: T[]
): Array<{ categoryId: number; items: T[] }> {
  // stable category order 1..5, omit empty groups
}
```

Mirror grouping style from `exportToExcel.ts` (iterate category order, push non-empty groups).

### Task 1: Trip hooks + totals utilities (TDD optional)

- [ ] **Step 1: Add `tripTotals.ts` and `groupTripItemsByCategory.ts`.** If Vitest exists, add unit tests for totals (null real prices, empty lists). If not, rely on manual + e2e.

- [ ] **Step 2: Implement `useAdminTrips`.**

```ts
export function useAdminTrips() {
  // listDrafts, listCompleted, loadTrip, createFromCartItems, createEmpty,
  // saveItems, complete, remove
  // track activeDraftTripId
}
```

### Task 2: AdminShoppingPage

- [ ] **Step 1: Build the priced table UI** with category headers, inputs for `realPrice` and quantity, Save draft, Complete.

- [ ] **Step 2: Wire App view `admin-shopping`.**

- [ ] **Step 3: CartPage CTA for admins** — create trip from cart items then `setView({ page: 'admin-shopping' })`.

- [ ] **Step 4: Manual path** — login → add API products to a new draft via “Add from catalog” → fill Precio Real → Save → Complete → see COMPLETED status.

### Task 3: AdminHistoryPage

- [ ] **Step 1: List completed trips** with totals.

- [ ] **Step 2: Detail read-only view** (selected trip).

- [ ] **Step 3: Delete with confirm.**

- [ ] **Step 4: Guest regression** — logout; CartPage has no admin CTA; Excel still exports.

### Task 4: Commit

- [ ] **Step 1: Commit on `feat/groceries-admin`.**

```bash
git add src/pages/AdminShoppingPage.tsx src/pages/AdminShoppingPage.module.css \
  src/pages/AdminHistoryPage.tsx src/pages/AdminHistoryPage.module.css \
  src/hooks/useAdminTrips.ts src/utils/groupTripItemsByCategory.ts \
  src/utils/tripTotals.ts src/App.tsx src/pages/CartPage.tsx \
  src/components/AdminNav.tsx
git commit -m "$(cat <<'EOF'
feat: add priced shopping session and grocery history for admins

EOF
)"
```

## Verification

- Excel layout fidelity: columns Producto / Cantidad / Precio / Total / Precio Real + category groups + totals.
- Draft survives reload (fetch DRAFT trips).
- Completed trips are immutable in UI (no item editors).
- Guests unchanged: memory cart + Excel/JSON export only.
