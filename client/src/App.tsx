// All pages of the app and which privilege each one needs.
import { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAuth, RequirePrivilege } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { NAVIGATION } from './navigation';

import { DashboardPage } from './pages/dashboard/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { PrivilegesPage } from './pages/privileges/PrivilegesPage';
import { CategoriesPage } from './pages/products/CategoriesPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { RolesPage } from './pages/roles/RolesPage';
import { StockPage } from './pages/stock/StockPage';
import { UsersPage } from './pages/users/UsersPage';

/** Shortcut: wrap a page so it's only shown with the given privilege. */
const guard = (privilege: string, page: ReactNode) => <RequirePrivilege privilege={privilege}>{page}</RequirePrivilege>;

/** After login, go to the first page in the menu the user is allowed to see. */
function HomeRedirect() {
  const { can } = useAuth();
  const firstPage = NAVIGATION.flatMap((section) => section.items).find((item) => can(item.privilege));
  return <Navigate to={firstPage?.to ?? '/no-access'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route path="dashboard" element={guard('dashboard.view', <DashboardPage />)} />
        <Route path="products" element={guard('products.view', <ProductsPage />)} />
        <Route path="categories" element={guard('products.view', <CategoriesPage />)} />
        <Route path="stock" element={guard('stock.view', <StockPage />)} />
        <Route path="orders" element={guard('orders.view', <OrdersPage />)} />
        <Route path="reports" element={guard('reports.view', <ReportsPage />)} />
        <Route path="users" element={guard('users.view', <UsersPage />)} />
        <Route path="roles" element={guard('roles.view', <RolesPage />)} />
        <Route path="privileges" element={guard('privileges.view', <PrivilegesPage />)} />
        <Route path="*" element={<div className="empty-state"><h2>Page not found</h2></div>} />
      </Route>
    </Routes>
  );
}
