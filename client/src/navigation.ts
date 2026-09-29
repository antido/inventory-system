// The sidebar menu. Each item is only shown if the user has its privilege.
import {
  BarChart3,
  KeyRound,
  LayoutDashboard,
  LucideIcon,
  Package,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Users,
  Warehouse,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  privilege: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAVIGATION: NavSection[] = [
  {
    title: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, privilege: 'dashboard.view' }],
  },
  {
    title: 'Inventory',
    items: [
      { to: '/products', label: 'Products', icon: Package, privilege: 'products.view' },
      { to: '/categories', label: 'Categories', icon: Tags, privilege: 'products.view' },
      { to: '/stock', label: 'Stock Control', icon: Warehouse, privilege: 'stock.view' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { to: '/orders', label: 'Orders', icon: ShoppingCart, privilege: 'orders.view' },
      { to: '/reports', label: 'Reports', icon: BarChart3, privilege: 'reports.view' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/users', label: 'Users', icon: Users, privilege: 'users.view' },
      { to: '/roles', label: 'Roles', icon: ShieldCheck, privilege: 'roles.view' },
      { to: '/privileges', label: 'Privileges', icon: KeyRound, privilege: 'privileges.view' },
    ],
  },
];
