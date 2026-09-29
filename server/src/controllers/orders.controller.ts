import { Request, Response } from 'express';
import { query, withTransaction } from '../config/db';
import { createOrderRecord } from '../services/orders';
import { changeStock } from '../services/stock';
import { badRequest, notFound } from '../utils/httpError';
import { idParam, optionalString, requireInteger, requireString } from '../utils/validate';

/** GET /api/orders?status=&search= */
export async function listOrders(req: Request, res: Response) {
  const where: string[] = [];
  const params: unknown[] = [];

  if (req.query.status) {
    where.push('o.status = ?');
    params.push(String(req.query.status));
  }
  if (req.query.search) {
    where.push('(o.order_number LIKE ? OR o.customer_name LIKE ?)');
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orders = await query(
    `SELECT o.id, o.order_number AS orderNumber, o.customer_name AS customerName, o.status,
            o.total, o.created_at AS createdAt, u.name AS createdBy,
            (SELECT SUM(quantity) FROM order_items oi WHERE oi.order_id = o.id) AS itemCount
       FROM orders o
       LEFT JOIN users u ON u.id = o.created_by
       ${whereSql}
      ORDER BY o.created_at DESC, o.id DESC`,
    params,
  );
  res.json(orders);
}

/** GET /api/orders/:id  - order with its items */
export async function getOrder(req: Request, res: Response) {
  const id = idParam(req.params.id);
  const [order] = await query(
    `SELECT o.id, o.order_number AS orderNumber, o.customer_name AS customerName, o.status,
            o.total, o.note, o.created_at AS createdAt, u.name AS createdBy
       FROM orders o
       LEFT JOIN users u ON u.id = o.created_by
      WHERE o.id = ?`,
    [id],
  );
  if (!order) throw notFound('Order not found');

  const items = await query(
    `SELECT oi.id, oi.product_id AS productId, p.name AS productName, p.sku,
            oi.quantity, oi.unit_price AS unitPrice, oi.subtotal
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?`,
    [id],
  );
  res.json({ ...order, items });
}

/** POST /api/orders  { customerName, note, items: [{ productId, quantity }] } */
export async function createOrder(req: Request, res: Response) {
  const customerName = requireString(req.body.customerName, 'Customer name');
  const note = optionalString(req.body.note);
  if (!Array.isArray(req.body.items)) throw badRequest('Items must be a list');

  const items = req.body.items.map((item: any) => ({
    productId: requireInteger(item.productId, 'Product', 1),
    quantity: requireInteger(item.quantity, 'Quantity', 1),
  }));

  const id = await withTransaction((conn) =>
    createOrderRecord(conn, { customerName, note, items, userId: req.user!.id }),
  );
  res.status(201).json({ id });
}

/**
 * PATCH /api/orders/:id/status  { status }
 *   pending -> completed   (order delivered / paid)
 *   pending -> cancelled   (stock is returned)
 */
export async function updateOrderStatus(req: Request, res: Response) {
  const id = idParam(req.params.id);
  const status = req.body.status;
  if (!['completed', 'cancelled'].includes(status)) throw badRequest('Status must be completed or cancelled');

  await withTransaction(async (conn) => {
    const [rows]: any = await conn.query('SELECT order_number, status FROM orders WHERE id = ? FOR UPDATE', [id]);
    const order = rows[0];
    if (!order) throw notFound('Order not found');
    if (order.status !== 'pending') throw badRequest(`This order is already ${order.status}`);

    if (status === 'cancelled') {
      // Put every item back into stock.
      const [items]: any = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
      for (const item of items) {
        await changeStock(conn, {
          productId: item.product_id,
          change: item.quantity,
          type: 'return',
          note: `Cancelled ${order.order_number}`,
          userId: req.user!.id,
        });
      }
    }

    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  });

  res.json({ message: `Order ${status}` });
}
