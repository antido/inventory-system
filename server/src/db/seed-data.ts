// Starting data inserted by `npm run db:setup`.
// Edit these lists to change the default privileges, roles and sample products.

/** Every privilege the app checks with requirePrivilege(...) */
export const PRIVILEGES = [
  { name: 'dashboard.view', module: 'Dashboard', description: 'View the dashboard' },

  { name: 'users.view', module: 'Users', description: 'View users' },
  { name: 'users.manage', module: 'Users', description: 'Add, edit and delete users' },

  { name: 'roles.view', module: 'Roles', description: 'View roles' },
  { name: 'roles.manage', module: 'Roles', description: 'Add, edit and delete roles' },

  { name: 'privileges.view', module: 'Privileges', description: 'View privileges' },
  { name: 'privileges.manage', module: 'Privileges', description: 'Add, edit and delete privileges' },

  { name: 'products.view', module: 'Products', description: 'View products and categories' },
  { name: 'products.manage', module: 'Products', description: 'Add, edit and delete products and categories' },

  { name: 'stock.view', module: 'Stock', description: 'View stock levels and movements' },
  { name: 'stock.manage', module: 'Stock', description: 'Receive, remove and adjust stock' },

  { name: 'orders.view', module: 'Orders', description: 'View orders' },
  { name: 'orders.create', module: 'Orders', description: 'Create new orders' },
  { name: 'orders.manage', module: 'Orders', description: 'Complete or cancel orders' },

  { name: 'reports.view', module: 'Reports', description: 'View reports and analytics' },
];

/** isSystem roles get every privilege automatically and can't be deleted. */
export const ROLES = [
  { name: 'Admin', description: 'Full access to everything', isSystem: true, privileges: [] as string[] },
  {
    name: 'Manager',
    description: 'Runs daily operations and sees reports',
    isSystem: false,
    privileges: [
      'dashboard.view',
      'users.view',
      'products.view',
      'products.manage',
      'stock.view',
      'stock.manage',
      'orders.view',
      'orders.create',
      'orders.manage',
      'reports.view',
    ],
  },
  {
    name: 'Staff',
    description: 'Handles orders and stock',
    isSystem: false,
    privileges: ['dashboard.view', 'products.view', 'stock.view', 'stock.manage', 'orders.view', 'orders.create'],
  },
];

export const USERS = [
  { name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'Admin' },
  { name: 'Maria Manager', email: 'manager@example.com', password: 'manager123', role: 'Manager' },
  { name: 'Sam Staff', email: 'staff@example.com', password: 'staff123', role: 'Staff' },
];

export const CATEGORIES = [
  { name: 'Electronics', description: 'Devices and gadgets' },
  { name: 'Office Supplies', description: 'Paper, pens and desk items' },
  { name: 'Furniture', description: 'Chairs, desks and storage' },
  { name: 'Accessories', description: 'Cables, bags and small add-ons' },
];

export const PRODUCTS = [
  { sku: 'ELE-001', name: 'Wireless Mouse', category: 'Electronics', price: 24.99, cost: 12, quantity: 120, reorderLevel: 20 },
  { sku: 'ELE-002', name: 'Mechanical Keyboard', category: 'Electronics', price: 89.99, cost: 52, quantity: 45, reorderLevel: 10 },
  { sku: 'ELE-003', name: '27" Monitor', category: 'Electronics', price: 249.0, cost: 170, quantity: 18, reorderLevel: 5 },
  { sku: 'ELE-004', name: 'USB-C Hub', category: 'Electronics', price: 39.5, cost: 18, quantity: 8, reorderLevel: 15 },
  { sku: 'OFF-001', name: 'A4 Paper (500 sheets)', category: 'Office Supplies', price: 6.5, cost: 3.2, quantity: 300, reorderLevel: 50 },
  { sku: 'OFF-002', name: 'Ballpoint Pens (12 pack)', category: 'Office Supplies', price: 4.99, cost: 1.8, quantity: 150, reorderLevel: 30 },
  { sku: 'OFF-003', name: 'Sticky Notes', category: 'Office Supplies', price: 3.25, cost: 1.1, quantity: 12, reorderLevel: 25 },
  { sku: 'FUR-001', name: 'Ergonomic Office Chair', category: 'Furniture', price: 199.0, cost: 120, quantity: 14, reorderLevel: 4 },
  { sku: 'FUR-002', name: 'Standing Desk', category: 'Furniture', price: 399.0, cost: 260, quantity: 6, reorderLevel: 3 },
  { sku: 'FUR-003', name: 'Filing Cabinet', category: 'Furniture', price: 129.0, cost: 75, quantity: 0, reorderLevel: 2 },
  { sku: 'ACC-001', name: 'Laptop Backpack', category: 'Accessories', price: 49.99, cost: 22, quantity: 60, reorderLevel: 10 },
  { sku: 'ACC-002', name: 'HDMI Cable 2m', category: 'Accessories', price: 9.99, cost: 3, quantity: 200, reorderLevel: 40 },
];

export const CUSTOMERS = ['Acme Corp', 'Globex Ltd', 'Initech', 'Umbrella Co', 'Stark Industries', 'Wayne Enterprises'];
