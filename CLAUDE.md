# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

StockFlow is a simple inventory system: React + TypeScript client, Express + TypeScript API, MySQL database.
The codebase is meant to be **readable for beginners**, so keep that goal in mind with every change:

- Prefer plain, explicit code over clever abstractions or extra libraries.
- Add a short comment at the top of new files explaining what the file is for, like the existing files do.
- Match the style of sibling files (naming, comment density, file layout).
- Don't add dependencies without asking.

Modules: Dashboard, Users, Roles, Privileges, Products & Categories, Stock Control, Orders, Reports.

## Commands

Run from the repository root unless noted.

| Task | Command |
| --- | --- |
| Install everything | `npm run install:all` |
| Create/reset the database with sample data | `npm run db:setup` (**wipes all data**, so ask first) |
| Run API + client | `npm run dev` (API on :4000, client on :5173) |
| Typecheck server | `npm run typecheck --prefix server` |
| Typecheck client | `npm run typecheck --prefix client` |
| Build both | `npm run build` |

There are no automated tests yet. After a change, verify it by typechecking both packages and, for API changes, hitting the endpoint (for example with curl after logging in via `POST /api/auth/login`).

Database settings live in `server/.env` (copy from `server/.env.example`). The local MySQL may not be on the default port, so read `.env` instead of assuming 3306.

Demo logins after `db:setup`: `admin@example.com / admin123`, `manager@example.com / manager123`, `staff@example.com / staff123`.

## Architecture

```
server/src/
  routes/index.ts       Every endpoint and the privilege it requires (single source of truth)
  controllers/          One file per module; validate input, run queries, send JSON
  services/             Shared business logic (permissions, stock changes, order creation)
  middleware/           requireAuth, requirePrivilege, errorHandler
  config/db.ts          query(), execute(), withTransaction() helpers
  utils/validate.ts     requireString / requireNumber / ... helpers (throw 400s)
  db/schema.sql         All tables; setup.ts runs it and seeds data from seed-data.ts

client/src/
  App.tsx               Routes + the privilege each page needs
  navigation.ts         Sidebar items (shown only if the user has the privilege)
  api/client.ts         fetch wrapper: adds the JWT, throws Error(message) on failure
  context/AuthContext   useAuth() -> user, login, logout, can(privilege)
  hooks/useFetch.ts     Load data: { data, loading, error, reload }
  hooks/useForm.ts      Modal form state: { values, setValue, saving, error, submit }
  components/ui.tsx     PageHeader, Modal, Field, Badge, StatCard, LoadState, ...
  pages/<module>/       One folder per module (Page + FormModal)
  styles.css            All styling; CSS variables at the top, responsive rules at the bottom
```

## Rules that must not be broken

- **Authorization is enforced on the server.** Every new route in `server/src/routes/index.ts` needs `can('module.action')`. Hiding buttons with `can()` in the client only improves the UX; it is not security.
- **Stock only changes through `changeStock()`** in `server/src/services/stock.ts`, inside `withTransaction()`. Never `UPDATE products SET quantity` anywhere else: that function locks the row, blocks negative stock, and writes the `stock_movements` history. Product edit forms deliberately don't change quantity.
- **Multi-step writes use `withTransaction()`** (orders, role privileges, stock).
- **Use parameterized queries** (`?` placeholders) and never build SQL from user input. Filters are built as `where[]` + `params[]` arrays, as in the existing controllers.
- **The Admin role (`is_system = 1`) always has every privilege** and cannot be deleted or renamed. Keep that guarantee so nobody gets locked out.
- **Never store or return password hashes.** Hash with bcrypt; `getUserWithPrivileges()` is the shape sent to the client.
- **Always present a written plan and wait for approval before beginning any multi-step task** 

## Adding things

**A new privilege:** add it to `PRIVILEGES` in `server/src/db/seed-data.ts` (and to role lists there if needed), guard the route with `can('x.y')`, and gate the UI with `useAuth().can('x.y')` plus `navigation.ts` / `App.tsx` if it has a page.

**A new module/page:** controller in `server/src/controllers/`, routes in `routes/index.ts`, types in `client/src/types.ts`, page folder in `client/src/pages/`, route + guard in `App.tsx`, menu item in `navigation.ts`.

**Schema changes:** edit `schema.sql` (and `seed-data.ts` / `setup.ts` if sample data is affected). There is no migration system; `db:setup` recreates everything.

## Conventions and gotchas

- **Money is Philippine pesos (₱).** Always format with `formatMoney` / `formatMoneyShort` from `client/src/utils/format.ts`; never hard-code `$` or `₱` in components (form labels like "Price (₱)" are the exception).
- **API data shapes:** MySQL decimals come back as numbers (`decimalNumbers: true`) and dates as `'YYYY-MM-DD HH:MM:SS'` strings (`dateStrings: true`). Parse dates with the helpers in `utils/format.ts`. SQL aliases use camelCase (`reorder_level AS reorderLevel`) so the client types match.
- **Express 5:** async handlers can just `throw`; errors reach `errorHandler`. Throw `HttpError` / `badRequest()` / `notFound()` for expected failures. MySQL duplicate/foreign-key errors are already turned into 409s.
- **Server TypeScript uses `module: nodenext` compiled as CommonJS**, so relative imports have no file extension (`from '../config/db'`).
- **Latest major versions are installed** (Express 5, React 19, React Router 7, Vite 8, TypeScript 7, Recharts 3, lucide-react 1). Check the installed API rather than assuming older syntax.
- **Styling uses design tokens.** All colors, font sizes, spacing, radii and shadows are CSS variables at the top of `styles.css` (`--text-sm`, `--space-4`, `--radius`, `--surface`, `--primary`, ...). Use them instead of new pixel values or hex colors, so both themes and the spacing stay consistent.
- **Light and dark theme:** `context/ThemeContext.tsx` puts `data-theme="light|dark"` on `<html>` (saved choice, else the device setting); `index.html` does the same before first paint. `styles.css` redefines only the color variables under `:root[data-theme='dark']`. Never hard-code a color in a component. Recharts needs real colors, so charts take them from `CHART_COLORS` in `components/charts.tsx` by theme.
- **Responsive design:** breakpoints are 1100px (two-column sections stack), 960px, 768px (sidebar becomes a slide-out menu) and 560px (phone: popups become bottom sheets, stat cards 2 per row). On phones, add `className="hide-sm"` to non-essential table columns and `show-sm` for phone-only content (e.g. the customer under the order number). Wrap tables in `.table-wrapper` (flush in a card) or `.table-scroll`. Check new UI at 360px width in both themes with no horizontal scroll, not even inside tables.
- **Product photos:** the browser optimizes a photo first (`client/src/utils/image.ts`: max 5 MB picked, resized to 1200px, WebP) and sends it as a data URL inside the normal JSON body (`image`, or `removeImage: true`). The server checks and saves it only through `services/productImages.ts`: real image bytes (not the file name), max 2 MB, random file name in `server/uploads/products/`. Store `image_path` in the database and return `imageUrl` to the client. Delete the file when a photo is replaced or removed, or the product is deleted. Photos are public at `/uploads/...` because product photos aren't sensitive; anything private must not be served this way. Show photos with `<ImageBox>` (it has the "No Image" placeholder) and pick them with `<ImagePicker>`.
- **Charts** (`components/charts.tsx`) show one series each, use one color, and have no legend. Never use a dual-axis chart; use two charts instead.
- The Vite dev server may move to port 5174 if 5173 is taken.
