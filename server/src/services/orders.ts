// Business logic for orders, shared by the orders controller and the seed script.
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { badRequest } from '../utils/httpError';
import { changeStock } from './stock';

export interface NewOrder {
  customerName: string;
  note?: string | null;
  items: { productId: number; quantity: number }[];
  userId: number | null;
  createdAt?: Date; // only used by the seed script to create past orders
}

/**
 * Creates an order, its items, and deducts the stock.
 * Must be called inside withTransaction() - if any item is out of
 * stock, the whole order is rolled back.
 */
export async function createOrderRecord(conn: PoolConnection, order: NewOrder): Promise<number> {
  if (order.items.length === 0) throw badRequest('Add at least one product to the order');

  const [orderResult] = await conn.query<ResultSetHeader>(
    'INSERT INTO orders (customer_name, note, created_by, created_at) VALUES (?, ?, ?, ?)',
    [order.customerName, order.note ?? null, order.userId, order.createdAt ?? new Date()],
  );
  const orderId = orderResult.insertId;
  const orderNumber = `ORD-${String(orderId).padStart(5, '0')}`;

  let total = 0;
  for (const item of order.items) {
    const [rows]: any = await conn.query('SELECT name, price, is_active FROM products WHERE id = ?', [
      item.productId,
    ]);
    const product = rows[0];
    if (!product) throw badRequest(`Product #${item.productId} not found`);
    if (!product.is_active) throw badRequest(`"${product.name}" is not available for sale`);

    const subtotal = product.price * item.quantity;
    total += subtotal;

    await conn.query(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
      [orderId, item.productId, item.quantity, product.price, subtotal],
    );
    await changeStock(conn, {
      productId: item.productId,
      change: -item.quantity,
      type: 'sale',
      note: `Order ${orderNumber}`,
      userId: order.userId,
    });
  }

  await conn.query('UPDATE orders SET order_number = ?, total = ? WHERE id = ?', [orderNumber, total, orderId]);
  return orderId;
}
