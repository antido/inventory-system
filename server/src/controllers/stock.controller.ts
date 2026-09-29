import { Request, Response } from 'express';
import { query, withTransaction } from '../config/db';
import { changeStock } from '../services/stock';
import { badRequest, notFound } from '../utils/httpError';
import { optionalString, requireInteger } from '../utils/validate';

/** GET /api/stock/movements?productId=&type=  - latest 200 movements */
export async function listMovements(req: Request, res: Response) {
  const where: string[] = [];
  const params: unknown[] = [];

  if (req.query.productId) {
    where.push('m.product_id = ?');
    params.push(Number(req.query.productId));
  }
  if (req.query.type) {
    where.push('m.type = ?');
    params.push(String(req.query.type));
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const movements = await query(
    `SELECT m.id, m.type, m.quantity_change AS quantityChange, m.quantity_after AS quantityAfter,
            m.note, m.created_at AS createdAt,
            p.id AS productId, p.name AS productName, p.sku,
            u.name AS userName
       FROM stock_movements m
       JOIN products p ON p.id = m.product_id
       LEFT JOIN users u ON u.id = m.user_id
       ${whereSql}
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT 200`,
    params,
  );
  res.json(movements);
}

/** GET /api/stock/alerts  - products at or below their reorder level */
export async function lowStockAlerts(_req: Request, res: Response) {
  const products = await query(
    `SELECT id, sku, name, quantity, reorder_level AS reorderLevel
       FROM products
      WHERE is_active = 1 AND quantity <= reorder_level
      ORDER BY quantity ASC`,
  );
  res.json(products);
}

/**
 * POST /api/stock/adjust  { productId, type, quantity, note }
 *   type "in"         -> add `quantity` to stock
 *   type "out"        -> remove `quantity` from stock
 *   type "adjustment" -> set stock to exactly `quantity` (after a stock count)
 */
export async function adjustStock(req: Request, res: Response) {
  const productId = requireInteger(req.body.productId, 'Product', 1);
  const quantity = requireInteger(req.body.quantity, 'Quantity');
  const type = req.body.type;
  const note = optionalString(req.body.note);

  if (!['in', 'out', 'adjustment'].includes(type)) {
    throw badRequest('Type must be in, out or adjustment');
  }
  if (type !== 'adjustment' && quantity === 0) throw badRequest('Quantity must be greater than 0');

  const [product] = await query('SELECT quantity FROM products WHERE id = ?', [productId]);
  if (!product) throw notFound('Product not found');

  const quantityAfter = await withTransaction(async (conn) => {
    let change = quantity;
    if (type === 'out') change = -quantity;
    if (type === 'adjustment') {
      // Re-read inside the transaction so we use the latest value.
      const [rows]: any = await conn.query('SELECT quantity FROM products WHERE id = ? FOR UPDATE', [productId]);
      change = quantity - rows[0].quantity;
    }
    return changeStock(conn, { productId, change, type, note, userId: req.user!.id });
  });

  res.json({ message: 'Stock updated', quantity: quantityAfter });
}
