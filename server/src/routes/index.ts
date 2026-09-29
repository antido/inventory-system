// All API routes in one place. Each line reads as:
//   METHOD  path  ->  who is allowed  ->  which controller function runs
import { Router } from 'express';
import { requireAuth, requirePrivilege as can } from '../middleware/auth';

import * as auth from '../controllers/auth.controller';
import * as categories from '../controllers/categories.controller';
import * as dashboard from '../controllers/dashboard.controller';
import * as orders from '../controllers/orders.controller';
import * as privileges from '../controllers/privileges.controller';
import * as products from '../controllers/products.controller';
import * as reports from '../controllers/reports.controller';
import * as roles from '../controllers/roles.controller';
import * as stock from '../controllers/stock.controller';
import * as users from '../controllers/users.controller';

export const router = Router();

// ---------- Public ----------
router.post('/auth/login', auth.login);

// ---------- Everything below requires a logged in user ----------
router.use(requireAuth);

router.get('/auth/me', auth.me);

// Dashboard
router.get('/dashboard', can('dashboard.view'), dashboard.getDashboard);

// Users
router.get('/users', can('users.view'), users.listUsers);
router.post('/users', can('users.manage'), users.createUser);
router.put('/users/:id', can('users.manage'), users.updateUser);
router.delete('/users/:id', can('users.manage'), users.deleteUser);

// Roles (users.manage can read roles so the "Add user" form can list them)
router.get('/roles', can('roles.view', 'users.manage'), roles.listRoles);
router.post('/roles', can('roles.manage'), roles.createRole);
router.put('/roles/:id', can('roles.manage'), roles.updateRole);
router.delete('/roles/:id', can('roles.manage'), roles.deleteRole);

// Privileges (roles.manage can read them to build the role form)
router.get('/privileges', can('privileges.view', 'roles.manage'), privileges.listPrivileges);
router.post('/privileges', can('privileges.manage'), privileges.createPrivilege);
router.put('/privileges/:id', can('privileges.manage'), privileges.updatePrivilege);
router.delete('/privileges/:id', can('privileges.manage'), privileges.deletePrivilege);

// Product catalog
router.get('/categories', can('products.view'), categories.listCategories);
router.post('/categories', can('products.manage'), categories.createCategory);
router.put('/categories/:id', can('products.manage'), categories.updateCategory);
router.delete('/categories/:id', can('products.manage'), categories.deleteCategory);

router.get('/products', can('products.view', 'orders.create', 'stock.view'), products.listProducts);
router.get('/products/:id', can('products.view'), products.getProduct);
router.post('/products', can('products.manage'), products.createProduct);
router.put('/products/:id', can('products.manage'), products.updateProduct);
router.delete('/products/:id', can('products.manage'), products.deleteProduct);

// Stock tracking & control
router.get('/stock/movements', can('stock.view'), stock.listMovements);
router.get('/stock/alerts', can('stock.view'), stock.lowStockAlerts);
router.post('/stock/adjust', can('stock.manage'), stock.adjustStock);

// Orders
router.get('/orders', can('orders.view'), orders.listOrders);
router.get('/orders/:id', can('orders.view'), orders.getOrder);
router.post('/orders', can('orders.create'), orders.createOrder);
router.patch('/orders/:id/status', can('orders.manage'), orders.updateOrderStatus);

// Reports
router.get('/reports', can('reports.view'), reports.getReport);
