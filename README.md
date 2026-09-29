# StockFlow – Simple Inventory System

A beginner-friendly inventory system built with:

| Part     | Tech                                                        |
| -------- | ----------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, React Router, Recharts, Lucide  |
| Backend  | Node.js, Express 5, TypeScript                              |
| Database | MySQL (via `mysql2`)                                        |
| Auth     | JWT tokens + bcrypt password hashing, role-based privileges |

## Modules

- **Dashboard**: key numbers, the last 7 days of sales, recent orders, and low stock alerts
- **Users**: add, edit, disable, and delete people who can sign in
- **Roles**: named groups of privileges (Admin, Manager, Staff, …)
- **Privileges**: single permissions such as `products.manage` that the server checks
- **Product Catalog**: products (SKU, price, cost, reorder level) and categories
- **Stock Tracking & Control**: receive stock, remove stock, set counts, and see the full movement history
- **Order Management**: create orders (stock is deducted automatically), then complete or cancel them (cancelling returns the stock)
- **Reports & Analytics**: revenue, profit, daily sales, top products, sales by category, and inventory value

---

## Getting started

### 1. Requirements

- [Node.js](https://nodejs.org) 20 or newer
- A running MySQL 8 server (XAMPP, MySQL Installer, Docker, …)

### 2. Install

```bash
npm run install:all
```

### 3. Configure the database connection

Copy `server/.env.example` to `server/.env`, then fill in your MySQL details:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=inventory_system
JWT_SECRET=any-long-random-string
```

### 4. Create the tables and sample data

```bash
npm run db:setup
```

This creates the database, all tables, 3 roles, 3 users, 12 products, and 30 days of sample orders.
**Running it again wipes and recreates everything.**

### 5. Run the app

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000/api

### Demo accounts

| Role    | Email               | Password   | Can do                                        |
| ------- | ------------------- | ---------- | --------------------------------------------- |
| Admin   | admin@example.com   | admin123   | Everything                                    |
| Manager | manager@example.com | manager123 | Products, stock, orders, reports, view users  |
| Staff   | staff@example.com   | staff123   | View products, manage stock, create orders    |

---

## Project structure

```
inventory-system/
├── server/                     Express API
│   └── src/
│       ├── index.ts            Starts the server
│       ├── app.ts              Express setup (middleware, routes, errors)
│       ├── config/
│       │   ├── env.ts          Reads settings from .env
│       │   └── db.ts           MySQL pool + query helpers + transactions
│       ├── routes/index.ts     EVERY endpoint and the privilege it needs
│       ├── middleware/
│       │   ├── auth.ts         requireAuth + requirePrivilege
│       │   └── errorHandler.ts Turns errors into JSON responses
│       ├── controllers/        One file per module – handles requests
│       ├── services/
│       │   ├── permissions.ts  Loads a user and their privileges
│       │   ├── stock.ts        changeStock(): the ONLY place stock changes
│       │   └── orders.ts       Creates an order + deducts stock
│       ├── utils/              Validation, errors, date helpers
│       └── db/
│           ├── schema.sql      All tables (read this first!)
│           ├── seed-data.ts    Default privileges, roles, users, products
│           └── setup.ts        Script behind `npm run db:setup`
│
└── client/                     React app
    └── src/
        ├── main.tsx            Entry point
        ├── App.tsx             All pages + which privilege each needs
        ├── navigation.ts       Sidebar menu items
        ├── types.ts            Shapes of API data
        ├── styles.css          All styling (colors at the top)
        ├── api/client.ts       fetch() wrapper that adds the login token
        ├── context/AuthContext.tsx  Logged in user, login(), logout(), can()
        ├── hooks/
        │   ├── useFetch.ts     Load data from the API
        │   └── useForm.ts      Form values + saving/error state
        ├── components/         Layout, route guards, charts, small UI pieces
        └── pages/              One folder per module
```

## How roles & privileges work

1. Every **privilege** is a name such as `orders.create`.
2. A **role** has a list of privileges. Every **user** has one role.
3. The **server** protects each route (see `server/src/routes/index.ts`):
   ```ts
   router.post('/orders', can('orders.create'), orders.createOrder);
   ```
4. The **client** hides menu items, pages, and buttons the user can't use:
   ```tsx
   {can('products.manage') && <button>Add product</button>}
   ```
   Hiding buttons only improves the experience. The real security check always happens on the server.
5. The **Admin** role is a *system role*: it can't be deleted and it always has every privilege, so you can't lock yourself out.

### Adding a new privilege

1. Add it to `PRIVILEGES` in `server/src/db/seed-data.ts`, or create it on the Privileges page.
2. Protect a route with `can('your.privilege')` in `server/src/routes/index.ts`.
3. Check it in the UI with `const { can } = useAuth()`.

## How stock is tracked

A product's `quantity` never changes directly. Every change goes through `changeStock()` in
`server/src/services/stock.ts`, which:

- locks the product row, so two orders can't sell the last item at the same time
- refuses to go below zero
- writes a row to `stock_movements` (in, out, adjustment, sale, or return)

This gives the Stock Control page a complete history of every change.

## API overview

| Method | Endpoint                  | Privilege                   |
| ------ | ------------------------- | --------------------------- |
| POST   | `/api/auth/login`         | public                      |
| GET    | `/api/auth/me`            | logged in                   |
| GET    | `/api/dashboard`          | dashboard.view              |
| CRUD   | `/api/users`              | users.view / users.manage   |
| CRUD   | `/api/roles`              | roles.view / roles.manage   |
| CRUD   | `/api/privileges`         | privileges.view / .manage   |
| CRUD   | `/api/categories`         | products.view / .manage     |
| CRUD   | `/api/products`           | products.view / .manage     |
| GET    | `/api/stock/movements`    | stock.view                  |
| GET    | `/api/stock/alerts`       | stock.view                  |
| POST   | `/api/stock/adjust`       | stock.manage                |
| GET    | `/api/orders`, `/:id`     | orders.view                 |
| POST   | `/api/orders`             | orders.create               |
| PATCH  | `/api/orders/:id/status`  | orders.manage               |
| GET    | `/api/reports?from=&to=`  | reports.view                |

## Ideas for next steps

- Suppliers and purchase orders
- Pagination for long lists
- Export reports to CSV
- Automated tests (Vitest + Supertest)
