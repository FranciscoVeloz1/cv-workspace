# 02 — Frontend Routing and Protected Routes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace `App.tsx`'s `useState<View>` navigation with `react-router` routes, add a `RequireAdmin` guard (reusing the existing `isGroceriesAdmin` capability), lift cart state into a `CartProvider` context so it survives navigation, and migrate all pages to `useNavigate`/`useParams`/`Link`.

**Scope:** Frontend only. No `personal-api`, no auth/permission logic changes. `AuthProvider`, `groceries-api-session`, `api/groceries.ts`, and `api/types.ts` are untouched.

**Prerequisite:** Spec 01 complete (component folders + `types/domain.ts` + vitest configured).

---

## Task 1: Write the failing `RequireAdmin` guard test

**Files:**
- Create: `repos/groceries-app/src/auth/RequireAdmin.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `repos/groceries-app/src/auth/RequireAdmin.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';
import { RequireAdmin } from './RequireAdmin';

function renderAt(path: string, contextValue: {
  status: 'bootstrapping' | 'authenticated' | 'anonymous';
  isGroceriesAdmin: boolean;
}) {
  // Auth context is accessed via useAuth(); mock the module.
  vi.mock('./AuthProvider', () => ({
    useAuth: () => contextValue
  }));

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<RequireAdmin><h1>Protected</h1></RequireAdmin>} />
        <Route path="/login" element={<h1>LoginPage</h1>} />
        <Route path="/forbidden" element={<h1>ForbiddenPage</h1>} />
      </Routes>
    </MemoryRouter>
  );
}
```

Then add the three cases:

```tsx
import { vi } from 'vitest';

describe('RequireAdmin', () => {
  it('shows a loading state while bootstrapping', () => {
    vi.resetModules();
    renderAt('/', { status: 'bootstrapping', isGroceriesAdmin: false });
    expect(screen.getByText(/Restoring session/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('redirects anonymous users to /login', () => {
    renderAt('/', { status: 'anonymous', isGroceriesAdmin: false });
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('redirects authenticated non-admins to /forbidden', () => {
    renderAt('/', { status: 'authenticated', isGroceriesAdmin: false });
    expect(screen.getByText('ForbiddenPage')).toBeInTheDocument();
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('renders children for an admin', () => {
    renderAt('/', { status: 'authenticated', isGroceriesAdmin: true });
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });
});
```

Note: because `vi.mock` is hoisted, keep the mock at module scope. If hoisting causes the per-test context to be stale, instead refactor to inject the context via a prop on a tiny wrapper. The simplest stable approach: export a `__setAuthForTests` handle is not needed — instead, render `RequireAdmin` with a mocked `useAuth` whose return is captured from a mutable variable:

```tsx
let currentAuth: { status: 'bootstrapping' | 'authenticated' | 'anonymous'; isGroceriesAdmin: boolean } = {
  status: 'anonymous',
  isGroceriesAdmin: false
};

vi.mock('./AuthProvider', () => ({
  useAuth: () => currentAuth
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<RequireAdmin><h1>Protected</h1></RequireAdmin>} />
        <Route path="/login" element={<h1>LoginPage</h1>} />
        <Route path="/forbidden" element={<h1>ForbiddenPage</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

it('redirects anonymous users to /login', () => {
  currentAuth = { status: 'anonymous', isGroceriesAdmin: false };
  renderAt('/');
  expect(screen.getByText('LoginPage')).toBeInTheDocument();
});
```

Use this mutable-variable form for all four cases.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd repos/groceries-app && npm run test -- src/auth/RequireAdmin.test.tsx`
Expected: FAIL — `Cannot find module './RequireAdmin'` (or its exports). This confirms the test runs and the implementation does not exist yet.

---

## Task 2: Implement `RequireAdmin`

**Files:**
- Create: `repos/groceries-app/src/auth/RequireAdmin.tsx`

- [ ] **Step 1: Create the guard**

Create `repos/groceries-app/src/auth/RequireAdmin.tsx`:

```tsx
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status, isGroceriesAdmin } = useAuth();

  if (status === 'bootstrapping') {
    return (
      <main aria-busy="true">
        <p>Restoring session…</p>
      </main>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />;
  }

  if (!isGroceriesAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `cd repos/groceries-app && npm run test -- src/auth/RequireAdmin.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 3: Commit**

```bash
git add repos/groceries-app/src/auth/RequireAdmin.tsx repos/groceries-app/src/auth/RequireAdmin.test.tsx
git commit -m "feat(groceries-app): add RequireAdmin route guard"
```

---

## Task 3: Add the route table and `ForbiddenPage`

**Files:**
- Create: `repos/groceries-app/src/config/routes.ts`
- Create: `repos/groceries-app/src/pages/ForbiddenPage.tsx`
- Create: `repos/groceries-app/src/pages/ForbiddenPage.module.css`

- [ ] **Step 1: Create the route constants**

Create `repos/groceries-app/src/config/routes.ts`:

```ts
export const ROUTES = {
  CATEGORIES: '/',
  PRODUCTS: '/products/:categoryId',
  CART: '/cart',
  LOGIN: '/login',
  ADMIN: '/admin',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_SHOPPING: '/admin/shopping',
  ADMIN_HISTORY: '/admin/history',
  ADMIN_HISTORY_TRIP: '/admin/history/:tripId',
  FORBIDDEN: '/forbidden'
} as const;
```

- [ ] **Step 2: Create `ForbiddenPage`**

Create `repos/groceries-app/src/pages/ForbiddenPage.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import styles from './ForbiddenPage.module.css';

export function ForbiddenPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Acceso restringido</h1>
      <p className={styles.text}>No tienes permiso de administrador.</p>
      <Link className={styles.link} to={ROUTES.CATEGORIES}>Volver al catálogo</Link>
    </div>
  );
}
```

Create `repos/groceries-app/src/pages/ForbiddenPage.module.css`:

```css
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  text-align: center;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
}

.text {
  color: #666;
}

.link {
  color: #2563eb;
  text-decoration: underline;
}
```

- [ ] **Step 3: Verify build**

Run: `cd repos/groceries-app && npm run build`
Expected: green (the new files compile; they are not wired into routes yet but have no unused-export errors).

- [ ] **Step 4: Commit**

```bash
git add repos/groceries-app/src/config/routes.ts repos/groceries-app/src/pages/ForbiddenPage.tsx repos/groceries-app/src/pages/ForbiddenPage.module.css
git commit -m "feat(groceries-app): add route constants and ForbiddenPage"
```

---

## Task 4: Lift cart state into a `CartProvider` context

`useCart()` today is in-memory `useState` held once in `App`. With routing, each page would get its own cart instance and the cart would reset on every navigation. Lift the existing logic into a context provider so all pages share one cart.

**Files:**
- Create: `repos/groceries-app/src/cart/CartProvider.tsx`
- Modify: `repos/groceries-app/src/hooks/useCart.ts`

- [ ] **Step 1: Create `CartProvider` with the existing cart logic**

Create `repos/groceries-app/src/cart/CartProvider.tsx`. Move all the state + callbacks from the old `useCart` into the provider; expose the same return shape via context.

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import type { Product } from '../types/domain';

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  addCustomItem: (item: { name: string; quantity: number; price: number }) => void;
  importCart: (items: CartItem[]) => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Map<number, CartItem>>(new Map());
  const customIdRef = useRef(-1);

  const addToCart = useCallback((product: Product) => {
    setItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(product.id);
      if (existing) {
        next.set(product.id, { ...existing, quantity: existing.quantity + 1 });
      } else {
        next.set(product.id, { product, quantity: 1 });
      }
      return next;
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setItems((prev) => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) => {
      const next = new Map(prev);
      if (quantity <= 0) {
        next.delete(productId);
      } else {
        const existing = next.get(productId);
        if (existing) {
          next.set(productId, { ...existing, quantity });
        }
      }
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems(new Map());
  }, []);

  const addCustomItem = useCallback(
    ({ name, quantity, price }: { name: string; quantity: number; price: number }) => {
      const product: Product = {
        id: customIdRef.current--,
        name,
        image: '',
        category: 5,
        price
      };
      setItems((prev) => {
        const next = new Map(prev);
        next.set(product.id, { product, quantity });
        return next;
      });
    },
    []
  );

  const importCart = useCallback((incoming: CartItem[]) => {
    const next = new Map<number, CartItem>();
    for (const item of incoming) {
      const existing = next.get(item.product.id);
      if (existing) {
        next.set(item.product.id, { ...existing, quantity: existing.quantity + item.quantity });
      } else {
        next.set(item.product.id, item);
      }
    }
    setItems(next);
  }, []);

  const cartItems = useMemo(() => Array.from(items.values()), [items]);
  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items: cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      addCustomItem,
      importCart,
      totalItems,
      totalPrice
    }),
    [addToCart, removeFromCart, updateQuantity, clearCart, addCustomItem, importCart, cartItems, totalItems, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error('useCart must be used within CartProvider');
  }
  return value;
}
```

- [ ] **Step 2: Replace `hooks/useCart.ts` with a re-export**

Replace `repos/groceries-app/src/hooks/useCart.ts` entirely with:

```ts
export { useCart, type CartItem } from '../cart/CartProvider';
```

This keeps every existing `import { useCart } from '../hooks/useCart'` and `import type { CartItem } from '../hooks/useCart'` working unchanged.

- [ ] **Step 3: Verify build + lint**

Run: `cd repos/groceries-app && npm run build && npm run lint`
Expected: green. (Pages still call `useCart()`; they will break at runtime outside a `CartProvider`, but that is wired in Task 6. The build only checks types — `useCart` is still a valid hook call.)

- [ ] **Step 4: Commit**

```bash
git add repos/groceries-app/src/cart repos/groceries-app/src/hooks/useCart.ts
git commit -m "refactor(groceries-app): lift cart state into CartProvider context"
```

---

## Task 5: Migrate `AdminNav` to `NavLink`

**Files:**
- Modify: `repos/groceries-app/src/components/AdminNav/index.tsx`

- [ ] **Step 1: Rewrite `AdminNav` to use `NavLink`**

Replace `repos/groceries-app/src/components/AdminNav/index.tsx` with:

```tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { ROUTES } from '../../config/routes';
import styles from './AdminNav.module.css';

export function AdminNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.CATEGORIES);
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? styles.linkActive : styles.link;

  return (
    <nav className={styles.nav} aria-label="Admin">
      <div className={styles.links}>
        <NavLink to={ROUTES.ADMIN_PRODUCTS} className={linkClass}>
          Productos
        </NavLink>
        <NavLink to={ROUTES.ADMIN_SHOPPING} className={linkClass}>
          Compra
        </NavLink>
        <NavLink to={ROUTES.ADMIN_HISTORY} className={linkClass}>
          Historial
        </NavLink>
      </div>
      <div className={styles.actions}>
        <NavLink to={ROUTES.CATEGORIES} className={styles.secondary}>
          Catálogo
        </NavLink>
        <button type="button" className={styles.logout} onClick={() => { void handleLogout(); }}>
          Salir
        </button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Drop the old `AdminPage` type and props**

The `AdminPage` type and the `active` / `onNavigate` / `onLogout` / `onBrowseCatalog` props are gone. Grep for any remaining importer of `type AdminPage` and remove it (the admin pages import it today):

Run: `cd repos/groceries-app && rg "type AdminPage|AdminPage" src`
Expected: hits in `AdminProductsPage.tsx`, `AdminShoppingPage.tsx`, `AdminHistoryPage.tsx`. These are rewritten in Task 7, so leave them for now — but expect a failing build until Task 7 lands. Do not run the build yet.

- [ ] **Step 3: Commit (intermediate; build will be fixed in Task 7)**

```bash
git add repos/groceries-app/src/components/AdminNav
git commit -m "refactor(groceries-app): migrate AdminNav to NavLink"
```

---

## Task 6: Rewrite `App.tsx` and `main.tsx` to routes

**Files:**
- Modify: `repos/groceries-app/src/App.tsx`
- Modify: `repos/groceries-app/src/main.tsx`

- [ ] **Step 1: Rewrite `main.tsx` with providers + `BrowserRouter`**

Replace `repos/groceries-app/src/main.tsx` with:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthProvider';
import { CartProvider } from './cart/CartProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  </StrictMode>
);
```

- [ ] **Step 2: Rewrite `App.tsx` as route composition**

Replace `repos/groceries-app/src/App.tsx` with:

```tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAdmin } from './auth/RequireAdmin';
import { ROUTES } from './config/routes';
import { AdminHistoryPage } from './pages/AdminHistoryPage';
import { AdminProductsPage } from './pages/AdminProductsPage';
import { AdminShoppingPage } from './pages/AdminShoppingPage';
import { CartPage } from './pages/CartPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { LoginPage } from './pages/LoginPage';
import { ProductListPage } from './pages/ProductListPage';

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
      <Route path={ROUTES.PRODUCTS} element={<ProductListPage />} />
      <Route path={ROUTES.CART} element={<CartPage />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.ADMIN} element={<Navigate to={ROUTES.ADMIN_PRODUCTS} replace />} />
      <Route
        path={ROUTES.ADMIN_PRODUCTS}
        element={<RequireAdmin><AdminProductsPage /></RequireAdmin>}
      />
      <Route
        path={ROUTES.ADMIN_SHOPPING}
        element={<RequireAdmin><AdminShoppingPage /></RequireAdmin>}
      />
      <Route
        path={ROUTES.ADMIN_HISTORY}
        element={<RequireAdmin><AdminHistoryPage /></RequireAdmin>}
      />
      <Route
        path={ROUTES.ADMIN_HISTORY_TRIP}
        element={<RequireAdmin><AdminHistoryPage /></RequireAdmin>}
      />
      <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />
      <Route path="*" element={<Navigate to={ROUTES.CATEGORIES} replace />} />
    </Routes>
  );
}
```

- [ ] **Step 3: Commit (build will be fixed once pages are migrated in Task 7)**

```bash
git add repos/groceries-app/src/App.tsx repos/groceries-app/src/main.tsx
git commit -m "feat(groceries-app): wire App and main into react-router routes"
```

---

## Task 7: Migrate pages to router navigation

Each page drops its `onBack` / `onNavigate` / `onSelectCategory` / `onCartClick` / `onAdminClick` / `onLogout` / `onBrowseCatalog` / `onCompleted` / `onAddToCart` / `onAddCustom` / `onImport` / `onUpdateQuantity` / `onRemove` / `onClear` / `cartCount` / `items` / `totalPrice` / `authStatus` / `isGroceriesAdmin` / `initialTripId` props and instead reads cart/auth via hooks and navigates with `useNavigate`/`useParams`/`Link`.

### 7a. `CategoriesPage`

**Files:** Modify `repos/groceries-app/src/pages/CategoriesPage.tsx`

- [ ] **Step 1: Rewrite `CategoriesPage`**

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useCart } from '../hooks/useCart';
import { useCategories } from '../hooks/useCategories';
import { ROUTES } from '../config/routes';
import { SearchBar } from '../components/SearchBar';
import { CategoryCard } from '../components/CategoryCard';
import { CartBadge } from '../components/CartBadge';
import styles from './CategoriesPage.module.css';

export function CategoriesPage() {
  const { entries } = useCategories();
  const { totalItems } = useCart();
  const { status, isGroceriesAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = search
    ? entries.filter((category) => category.name.toLowerCase().includes(search.toLowerCase()))
    : entries;

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.CATEGORIES);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Categories</h1>
        <CartBadge count={totalItems} onClick={() => navigate(ROUTES.CART)} />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search for a category..." />

      <div className={styles.grid}>
        {filtered.map((cat) => (
          <CategoryCard key={cat.id} name={cat.name} onClick={() => navigate(`/products/${cat.id}`)} />
        ))}
      </div>

      <div className={styles.adminBar}>
        {status === 'anonymous' || status === 'bootstrapping' ? (
          <Link to={ROUTES.LOGIN} className={styles.adminLink}>Admin</Link>
        ) : null}

        {status === 'authenticated' && isGroceriesAdmin ? (
          <div className={styles.adminAuthenticated}>
            <span className={styles.liveLabel}>Catálogo (guest JSON abajo)</span>
            <Link to={ROUTES.ADMIN_PRODUCTS} className={styles.adminLink}>Panel admin</Link>
            <button type="button" className={styles.logoutLink} onClick={() => { void handleLogout(); }}>Salir</button>
          </div>
        ) : null}

        {status === 'authenticated' && !isGroceriesAdmin ? (
          <div className={styles.adminAuthenticated}>
            <span className={styles.liveLabel}>Sin permiso de administrador</span>
            <button type="button" className={styles.logoutLink} onClick={() => { void handleLogout(); }}>Salir</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add repos/groceries-app/src/pages/CategoriesPage.tsx
git commit -m "refactor(groceries-app): migrate CategoriesPage to router navigation"
```

### 7b. `ProductListPage`

**Files:** Modify `repos/groceries-app/src/pages/ProductListPage.tsx`

- [ ] **Step 1: Rewrite `ProductListPage`**

```tsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useCart } from '../hooks/useCart';
import { ROUTES } from '../config/routes';
import { SearchBar } from '../components/SearchBar';
import { ProductCard } from '../components/ProductCard';
import { CartBadge } from '../components/CartBadge';
import styles from './ProductListPage.module.css';

export function ProductListPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const id = Number(categoryId);
  const [search, setSearch] = useState('');
  const products = useProducts(id, search);
  const { categories } = useCategories();
  const { addToCart, addCustomItem, totalItems } = useCart();
  const navigate = useNavigate();

  const categoryName = categories[id as keyof typeof categories];

  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [customPrice, setCustomPrice] = useState(0);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customName.trim();
    if (!trimmed || customQty < 1 || customPrice < 0) return;
    addCustomItem({ name: trimmed, quantity: customQty, price: customPrice });
    setCustomName('');
    setCustomQty(1);
    setCustomPrice(0);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(ROUTES.CATEGORIES)} aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className={styles.title}>{categoryName}</h1>
        <CartBadge count={totalItems} onClick={() => navigate(ROUTES.CART)} />
      </div>
      <SearchBar value={search} onChange={setSearch} />

      {id === 5 && (
        <form className={styles.addForm} onSubmit={handleAddCustom}>
          <h2 className={styles.addFormTitle}>Add item manually</h2>
          <div className={styles.addFormFields}>
            <label className={styles.addField}>
              <span className={styles.addLabel}>Name</span>
              <input className={styles.addInput} type="text" placeholder="Product name" value={customName} onChange={(e) => setCustomName(e.target.value)} required />
            </label>
            <label className={styles.addField}>
              <span className={styles.addLabel}>Quantity</span>
              <input className={styles.addInput} type="number" placeholder="1" min={1} value={customQty} onChange={(e) => setCustomQty(Number(e.target.value))} required />
            </label>
            <label className={styles.addField}>
              <span className={styles.addLabel}>Unit price</span>
              <input className={styles.addInput} type="number" placeholder="0.00" min={0} step={0.01} value={customPrice} onChange={(e) => setCustomPrice(Number(e.target.value))} required />
            </label>
          </div>
          <button className={styles.addBtn} type="submit">Add</button>
        </form>
      )}

      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={addToCart} />
        ))}
        {products.length === 0 && <p className={styles.empty}>No products found.</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add repos/groceries-app/src/pages/ProductListPage.tsx
git commit -m "refactor(groceries-app): migrate ProductListPage to router navigation"
```

### 7c. `CartPage`

**Files:** Modify `repos/groceries-app/src/pages/CartPage.tsx`

- [ ] **Step 1: Rewrite `CartPage`**

It reads cart from `useCart()`, reads `isGroceriesAdmin` from `useAuth()`, and for the "start shopping" CTA calls `useAdminTrips().createFromCartItems` then navigates to `/admin/shopping`.

```tsx
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useCart } from '../hooks/useCart';
import { useAdminTrips } from '../hooks/useAdminTrips';
import { useCategories } from '../hooks/useCategories';
import { ROUTES } from '../config/routes';
import { exportToExcel } from '../utils/exportToExcel';
import { exportToJson } from '../utils/exportToJson';
import { parseGroceryList } from '../utils/groceryList';
import styles from './CartPage.module.css';

export function CartPage() {
  const { items, totalPrice, updateQuantity, removeFromCart, clearCart, importCart } = useCart();
  const { isGroceriesAdmin } = useAuth();
  const { categories } = useCategories();
  const trips = useAdminTrips();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [starting, setStarting] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const parsed = parseGroceryList(raw);
      importCart(parsed);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import file.');
    }
    e.target.value = '';
  };

  const startShopping = async () => {
    setStarting(true);
    try {
      await trips.createFromCartItems(items);
      clearCart();
      navigate(ROUTES.ADMIN_SHOPPING);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar el mandado';
      window.alert(message);
    } finally {
      setStarting(false);
    }
  };

  const grouped = new Map<number, typeof items[number][]>();
  for (const item of items) {
    const cat = item.product.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className={styles.title}>Cart</h1>
        <div className={styles.headerActions}>
          <button className={styles.importBtn} onClick={handleImportClick}>Import</button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFileChange} hidden />
          {items.length > 0 && <button className={styles.clearBtn} onClick={clearCart}>Clear</button>}
        </div>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>Your cart is empty.</p>
      ) : (
        <>
          <div className={styles.list}>
            {Array.from(grouped.entries()).map(([catId, catItems]) => (
              <div key={catId} className={styles.group}>
                <h2 className={styles.categoryName}>{categories[catId as keyof typeof categories]}</h2>
                {catItems.map((item) => (
                  <div key={item.product.id} className={styles.item}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.product.name}</span>
                      <span className={styles.itemPrice}>${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className={styles.controls}>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item.product.id, item.quantity - 1)} aria-label="Decrease quantity">-</button>
                      <span className={styles.qty}>{item.quantity}</span>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item.product.id, item.quantity + 1)} aria-label="Increase quantity">+</button>
                      <button className={styles.removeBtn} onClick={() => removeFromCart(item.product.id)} aria-label={`Remove ${item.product.name}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <div className={styles.total}>
              <span>Total</span>
              <span className={styles.totalPrice}>${totalPrice.toFixed(2)}</span>
            </div>
            <div className={styles.exportActions}>
              {isGroceriesAdmin && items.length > 0 ? (
                <button className={styles.exportBtn} onClick={() => { void startShopping(); }} disabled={starting}>
                  {starting ? 'Iniciando…' : 'Iniciar mandado (precios reales)'}
                </button>
              ) : null}
              <button className={styles.exportBtn} onClick={() => exportToExcel(items)}>Export Excel</button>
              <button className={styles.exportBtnSecondary} onClick={() => exportToJson(items)}>Export JSON</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add repos/groceries-app/src/pages/CartPage.tsx
git commit -m "refactor(groceries-app): migrate CartPage to router navigation"
```

### 7d. `LoginPage`

**Files:** Modify `repos/groceries-app/src/pages/LoginPage.tsx`

- [ ] **Step 1: Rewrite `LoginPage`**

Replace the `onSuccessAdmin` / `onBack` props with `useNavigate`. On `status === 'authenticated' && isGroceriesAdmin`, navigate to `/admin/products`.

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/http';
import { useAuth } from '../auth/AuthProvider';
import { ROUTES } from '../config/routes';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { login, logout, isGroceriesAdmin, status } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && isGroceriesAdmin) {
      navigate(ROUTES.ADMIN_PRODUCTS, { replace: true });
    }
  }, [isGroceriesAdmin, navigate, status]);

  useEffect(() => {
    if (status === 'authenticated' && !isGroceriesAdmin) {
      setError('No tienes permiso de administrador');
    }
  }, [isGroceriesAdmin, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'No se pudo iniciar sesión';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setError(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(ROUTES.CATEGORIES)} aria-label="Volver">←</button>
        <h1 className={styles.title}>Admin</h1>
      </div>

      <p className={styles.subtitle}>Inicia sesión para administrar el catálogo.</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="admin-email">Correo</label>
        <input id="admin-email" className={styles.input} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className={styles.label} htmlFor="admin-password">Contraseña</label>
        <input id="admin-password" className={styles.input} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        {error ? <p className={styles.error}>{error}</p> : null}
        <button type="submit" className={styles.submit} disabled={submitting}>{submitting ? 'Entrando…' : 'Entrar'}</button>
      </form>

      {status === 'authenticated' && !isGroceriesAdmin ? (
        <button type="button" className={styles.logout} onClick={() => { void handleLogout(); }}>Cerrar sesión</button>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add repos/groceries-app/src/pages/LoginPage.tsx
git commit -m "refactor(groceries-app): migrate LoginPage to router navigation"
```

### 7e. `AdminProductsPage`

**Files:** Modify `repos/groceries-app/src/pages/AdminProductsPage.tsx`

- [ ] **Step 1: Drop the props; render `<AdminNav />` with no props**

In `repos/groceries-app/src/pages/AdminProductsPage.tsx`:
- Remove the `Props` type and the `{ onNavigate, onLogout, onBrowseCatalog }` destructuring.
- Change `export function AdminProductsPage() {`.
- Remove the `import { AdminNav, type AdminPage } from '../components/AdminNav';` and replace with `import { AdminNav } from '../components/AdminNav';`.
- Replace the `<AdminNav active="admin-products" onNavigate={...} onLogout={...} onBrowseCatalog={...} />` JSX with `<AdminNav />`.

The body (form + list + `useAdminProducts()`) is unchanged. The only edits are the signature, the import, and the `<AdminNav />` call.

- [ ] **Step 2: Commit**

```bash
git add repos/groceries-app/src/pages/AdminProductsPage.tsx
git commit -m "refactor(groceries-app): migrate AdminProductsPage to router navigation"
```

### 7f. `AdminShoppingPage`

**Files:** Modify `repos/groceries-app/src/pages/AdminShoppingPage.tsx`

- [ ] **Step 1: Drop the props; complete via `useNavigate`**

In `repos/groceries-app/src/pages/AdminShoppingPage.tsx`:
- Remove the `Props` type and `{ onNavigate, onLogout, onBrowseCatalog, onCompleted }` destructuring; change to `export function AdminShoppingPage() {`.
- Replace `import { AdminNav, type AdminPage } from '../components/AdminNav';` with `import { AdminNav } from '../components/AdminNav';`.
- Add `import { useNavigate } from 'react-router-dom';` and `import { ROUTES } from '../config/routes';`.
- Inside the component: `const navigate = useNavigate();`
- In `handleComplete`, replace `onCompleted(completed.id);` with `navigate(\`/admin/history/${completed.id}\`, { replace: true });`.
- Replace the `<AdminNav ... />` JSX with `<AdminNav />`.

- [ ] **Step 2: Commit**

```bash
git add repos/groceries-app/src/pages/AdminShoppingPage.tsx
git commit -m "refactor(groceries-app): migrate AdminShoppingPage to router navigation"
```

### 7g. `AdminHistoryPage`

**Files:** Modify `repos/groceries-app/src/pages/AdminHistoryPage.tsx`

- [ ] **Step 1: Read `tripId` from `useParams` instead of `initialTripId` prop**

In `repos/groceries-app/src/pages/AdminHistoryPage.tsx`:
- Remove the `Props` type and `{ onNavigate, onLogout, onBrowseCatalog, initialTripId }` destructuring; change to `export function AdminHistoryPage() {`.
- Replace `import { AdminNav, type AdminPage } from '../components/AdminNav';` with `import { AdminNav } from '../components/AdminNav';`.
- Add `import { useParams } from 'react-router-dom';`.
- Inside the component: `const { tripId } = useParams<{ tripId: string }>();` and use `tripId` everywhere `initialTripId` was used (the `useEffect` dependency and the `if (initialTripId)` check become `if (tripId)`).
- Replace the `<AdminNav ... />` JSX with `<AdminNav />`.

- [ ] **Step 2: Commit**

```bash
git add repos/groceries-app/src/pages/AdminHistoryPage.tsx
git commit -m "refactor(groceries-app): migrate AdminHistoryPage to router navigation"
```

---

## Task 8: Full build, lint, and test

- [ ] **Step 1: Build**

Run: `cd repos/groceries-app && npm run build`
Expected: `tsc -b` and `vite build` succeed. If `tsc` reports unused locals/params, remove them (e.g. leftover `AdminPage` imports, `authStatus` props). Common fixes:
- Remove any remaining `import type { AdminPage }`.
- Ensure no page still references `onNavigate`, `onBack`, `isGroceriesAdmin` prop, `cartCount`, etc.

- [ ] **Step 2: Lint**

Run: `cd repos/groceries-app && npm run lint`
Expected: green. If `react-refresh/only-export-components` complains about `AuthProvider`/`CartProvider` exporting hooks alongside components, add an `// eslint-disable-next-line react-refresh/only-export-components` line above the `useAuth`/`useCart` export (AuthProvider already has one; mirror it for `useCart`).

- [ ] **Step 3: Test**

Run: `cd repos/groceries-app && npm run test`
Expected: the `RequireAdmin` tests pass (4/4).

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(groceries-app): clean up unused props after router migration"
```
If there were no fixes, skip.
