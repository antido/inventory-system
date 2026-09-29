import { Request, Response } from 'express';
import { query } from '../config/db';
import { badRequest } from '../utils/httpError';
import { datesBetween, daysAgo, toDateString } from '../utils/dates';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Defaults to the last 30 days. Cancelled orders are not counted as sales.
 */
export async function getReport(req: Request, res: Response) {
  const from = String(req.query.from ?? daysAgo(29));
  const to = String(req.query.to ?? toDateString(new Date()));
  if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) throw badRequest('Dates must be YYYY-MM-DD');
  if (from > to) throw badRequest('"From" must be before "To"');

  // Reused in every sales query: orders inside the date range that weren't cancelled.
  const salesFilter = `o.status <> 'cancelled' AND DATE(o.created_at) BETWEEN ? AND ?`;
  const range = [from, to];

  const [summary] = await query(
    `SELECT COUNT(DISTINCT o.id)          AS orderCount,
            COALESCE(SUM(o.total), 0)     AS revenue,
            COALESCE(AVG(o.total), 0)     AS averageOrderValue
       FROM orders o
      WHERE ${salesFilter}`,
    range,
  );

  const [profit] = await query(
    `SELECT COALESCE(SUM(oi.quantity), 0)                       AS itemsSold,
            COALESCE(SUM(oi.subtotal - oi.quantity * p.cost), 0) AS grossProfit
       FROM order_items oi
       JOIN orders o   ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
      WHERE ${salesFilter}`,
    range,
  );

  const dailyRows = await query<{ day: string; revenue: number; orders: number }>(
    `SELECT DATE(o.created_at) AS day, SUM(o.total) AS revenue, COUNT(*) AS orders
       FROM orders o
      WHERE ${salesFilter}
      GROUP BY DATE(o.created_at)`,
    range,
  );
  // Fill in days without sales so the chart has no gaps.
  const dailySales = datesBetween(from, to).map((day) => {
    const row = dailyRows.find((r) => r.day === day);
    return { date: day, revenue: Number(row?.revenue ?? 0), orders: Number(row?.orders ?? 0) };
  });

  const topProducts = await query(
    `SELECT p.id, p.sku, p.name, SUM(oi.quantity) AS quantitySold, SUM(oi.subtotal) AS revenue
       FROM order_items oi
       JOIN orders o   ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
      WHERE ${salesFilter}
      GROUP BY p.id, p.sku, p.name
      ORDER BY revenue DESC
      LIMIT 10`,
    range,
  );

  const salesByCategory = await query(
    `SELECT COALESCE(c.name, 'Uncategorized') AS category, SUM(oi.subtotal) AS revenue
       FROM order_items oi
       JOIN orders o     ON o.id = oi.order_id
       JOIN products p   ON p.id = oi.product_id
       LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${salesFilter}
      GROUP BY c.name
      ORDER BY revenue DESC`,
    range,
  );

  // Inventory value is a snapshot of "right now", not limited by the date range.
  const inventoryByCategory = await query(
    `SELECT COALESCE(c.name, 'Uncategorized') AS category,
            COUNT(p.id)                 AS productCount,
            SUM(p.quantity)             AS units,
            SUM(p.quantity * p.cost)    AS costValue,
            SUM(p.quantity * p.price)   AS retailValue
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
      GROUP BY c.name
      ORDER BY costValue DESC`,
  );

  res.json({
    from,
    to,
    summary: { ...summary, ...profit },
    dailySales,
    topProducts,
    salesByCategory,
    inventoryByCategory,
  });
}
