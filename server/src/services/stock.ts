// The ONE place where a product's quantity changes.
// Products, Stock and Orders all call changeStock(), so every change
// is checked (no negative stock) and logged in stock_movements.
import { PoolConnection } from 'mysql2/promise';
import { badRequest, notFound } from '../utils/httpError';

export type MovementType = 'in' | 'out' | 'adjustment' | 'sale' | 'return';

interface StockChange {
  productId: number;
  change: number; // positive = add stock, negative = remove stock
  type: MovementType;
  note?: string | null;
  userId?: number | null;
}

/** Must be called inside withTransaction() so it can lock the product row. */
export async function changeStock(conn: PoolConnection, { productId, change, type, note, userId }: StockChange) {
  // FOR UPDATE locks the row until the transaction ends, so two people
  // selling the last item at the same time can't both succeed.
  const [rows]: any = await conn.query('SELECT name, quantity FROM products WHERE id = ? FOR UPDATE', [productId]);
  const product = rows[0];
  if (!product) throw notFound(`Product #${productId} not found`);

  const quantityAfter = product.quantity + change;
  if (quantityAfter < 0) {
    throw badRequest(`Not enough stock for "${product.name}" (only ${product.quantity} left)`);
  }

  await conn.query('UPDATE products SET quantity = ? WHERE id = ?', [quantityAfter, productId]);
  await conn.query(
    `INSERT INTO stock_movements (product_id, type, quantity_change, quantity_after, note, user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [productId, type, change, quantityAfter, note ?? null, userId ?? null],
  );

  return quantityAfter;
}
