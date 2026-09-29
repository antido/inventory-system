import { Request, Response } from 'express';
import { ResultSetHeader } from 'mysql2/promise';
import { execute, query, withTransaction } from '../config/db';
import { changeStock } from '../services/stock';
import { notFound } from '../utils/httpError';
import {
  idParam,
  optionalId,
  optionalString,
  requireInteger,
  requireNumber,
  requireString,
  toBoolean,
} from '../utils/validate';

const PRODUCT_COLUMNS = `
  p.id, p.sku, p.name, p.description, p.price, p.cost, p.quantity,
  p.reorder_level AS reorderLevel, p.is_active AS isActive,
  p.category_id AS categoryId, c.name AS categoryName,
  p.created_at AS createdAt, p.updated_at AS updatedAt`;

/**
 * GET /api/products?search=&categoryId=&stock=low|out
 * All filters are optional.
 */
export async function listProducts(req: Request, res: Response) {
  const where: string[] = [];
  const params: unknown[] = [];

  if (req.query.search) {
    where.push('(p.name LIKE ? OR p.sku LIKE ?)');
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
  }
  if (req.query.categoryId) {
    where.push('p.category_id = ?');
    params.push(Number(req.query.categoryId));
  }
  if (req.query.stock === 'low') where.push('p.quantity <= p.reorder_level AND p.quantity > 0');
  if (req.query.stock === 'out') where.push('p.quantity = 0');

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const products = await query(
    `SELECT ${PRODUCT_COLUMNS}
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql}
      ORDER BY p.name`,
    params,
  );
  res.json(products.map((p) => ({ ...p, isActive: Boolean(p.isActive) })));
}

/** GET /api/products/:id */
export async function getProduct(req: Request, res: Response) {
  const id = idParam(req.params.id);
  const [product] = await query(
    `SELECT ${PRODUCT_COLUMNS} FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
    [id],
  );
  if (!product) throw notFound('Product not found');
  res.json({ ...product, isActive: Boolean(product.isActive) });
}

/** Reads and validates the editable product fields from the request body. */
function readProductBody(body: any) {
  return {
    sku: requireString(body.sku, 'SKU').toUpperCase(),
    name: requireString(body.name, 'Name'),
    description: optionalString(body.description),
    categoryId: optionalId(body.categoryId),
    price: requireNumber(body.price, 'Price'),
    cost: requireNumber(body.cost, 'Cost'),
    reorderLevel: requireInteger(body.reorderLevel, 'Reorder level'),
    isActive: toBoolean(body.isActive),
  };
}

/** POST /api/products  { sku, name, ..., initialQuantity } */
export async function createProduct(req: Request, res: Response) {
  const product = readProductBody(req.body);
  const initialQuantity = requireInteger(req.body.initialQuantity ?? 0, 'Initial quantity');

  const id = await withTransaction(async (conn) => {
    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO products (sku, name, description, category_id, price, cost, reorder_level, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.sku,
        product.name,
        product.description,
        product.categoryId,
        product.price,
        product.cost,
        product.reorderLevel,
        product.isActive,
      ],
    );

    // Opening stock is recorded as a normal "stock in" movement.
    if (initialQuantity > 0) {
      await changeStock(conn, {
        productId: result.insertId,
        change: initialQuantity,
        type: 'in',
        note: 'Initial stock',
        userId: req.user!.id,
      });
    }
    return result.insertId;
  });

  res.status(201).json({ id });
}

/**
 * PUT /api/products/:id
 * Quantity is NOT editable here on purpose - use the Stock module
 * so the change is tracked.
 */
export async function updateProduct(req: Request, res: Response) {
  const id = idParam(req.params.id);
  const product = readProductBody(req.body);

  const result = await execute(
    `UPDATE products
        SET sku = ?, name = ?, description = ?, category_id = ?, price = ?, cost = ?,
            reorder_level = ?, is_active = ?
      WHERE id = ?`,
    [
      product.sku,
      product.name,
      product.description,
      product.categoryId,
      product.price,
      product.cost,
      product.reorderLevel,
      product.isActive,
      id,
    ],
  );
  if (result.affectedRows === 0) throw notFound('Product not found');
  res.json({ message: 'Product updated' });
}

/** DELETE /api/products/:id  - fails if the product appears in an order */
export async function deleteProduct(req: Request, res: Response) {
  const id = idParam(req.params.id);
  const result = await execute('DELETE FROM products WHERE id = ?', [id]);
  if (result.affectedRows === 0) throw notFound('Product not found');
  res.json({ message: 'Product deleted' });
}
