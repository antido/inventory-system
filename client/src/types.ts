// Shapes of the data returned by the API.
// Keeping them in one file makes it easy to see what each module works with.

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  role: { id: number; name: string; isSystem: boolean };
  privileges: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  isActive: number | boolean;
  roleId: number;
  roleName: string;
  createdAt: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  privilegeIds: number[];
}

export interface Privilege {
  id: number;
  name: string;
  module: string;
  description: string | null;
  roleCount: number;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  productCount: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  cost: number;
  quantity: number;
  reorderLevel: number;
  isActive: boolean;
  categoryId: number | null;
  categoryName: string | null;
  /** e.g. '/uploads/products/3f2c....webp', or null when there is no photo */
  imageUrl: string | null;
}

export type MovementType = 'in' | 'out' | 'adjustment' | 'sale' | 'return';

export interface StockMovement {
  id: number;
  type: MovementType;
  quantityChange: number;
  quantityAfter: number;
  note: string | null;
  createdAt: string;
  productId: number;
  productName: string;
  sku: string;
  userName: string | null;
}

export type OrderStatus = 'pending' | 'completed' | 'cancelled';

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  createdBy: string | null;
  itemCount: number;
}

export interface OrderDetails extends Omit<Order, 'itemCount'> {
  note: string | null;
  items: {
    id: number;
    productId: number;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

export interface LowStockItem {
  id: number;
  sku: string;
  name: string;
  quantity: number;
  reorderLevel: number;
}

export interface DashboardData {
  stats: {
    totalProducts: number;
    lowStockCount: number;
    stockValue: number;
    pendingOrders: number;
    ordersToday: number;
    revenueThisMonth: number;
  };
  recentOrders: Omit<Order, 'itemCount' | 'createdBy'>[];
  lowStock: LowStockItem[];
  salesLast7Days: { date: string; total: number }[];
}

export interface ReportData {
  from: string;
  to: string;
  summary: {
    orderCount: number;
    revenue: number;
    averageOrderValue: number;
    itemsSold: number;
    grossProfit: number;
  };
  dailySales: { date: string; revenue: number; orders: number }[];
  topProducts: { id: number; sku: string; name: string; quantitySold: number; revenue: number }[];
  salesByCategory: { category: string; revenue: number }[];
  inventoryByCategory: {
    category: string;
    productCount: number;
    units: number;
    costValue: number;
    retailValue: number;
  }[];
}
