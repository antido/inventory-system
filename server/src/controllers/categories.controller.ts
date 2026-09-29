import { Request, Response } from 'express';
import { execute, query } from '../config/db';
import { notFound } from '../utils/httpError';
import { idParam, optionalString, requireString } from '../utils/validate';

/** GET /api/categories */
export async function listCategories(_req: Request, res: Response) {
  const categories = await query(
    `SELECT c.id, c.name, c.description,
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS productCount
       FROM categories c
      ORDER BY c.name`,
  );
  res.json(categories);
}

/** POST /api/categories  { name, description } */
export async function createCategory(req: Request, res: Response) {
  const name = requireString(req.body.name, 'Name');
  const description = optionalString(req.body.description);

  const result = await execute('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
  res.status(201).json({ id: result.insertId });
}

/** PUT /api/categories/:id  { name, description } */
export async function updateCategory(req: Request, res: Response) {
  const id = idParam(req.params.id);
  const name = requireString(req.body.name, 'Name');
  const description = optionalString(req.body.description);

  const result = await execute('UPDATE categories SET name = ?, description = ? WHERE id = ?', [
    name,
    description,
    id,
  ]);
  if (result.affectedRows === 0) throw notFound('Category not found');
  res.json({ message: 'Category updated' });
}

/** DELETE /api/categories/:id  - products in it become "Uncategorized" */
export async function deleteCategory(req: Request, res: Response) {
  const id = idParam(req.params.id);
  const result = await execute('DELETE FROM categories WHERE id = ?', [id]);
  if (result.affectedRows === 0) throw notFound('Category not found');
  res.json({ message: 'Category deleted' });
}
