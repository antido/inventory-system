import { Request, Response } from 'express';
import { query } from '../config/db';
import { lastNDays } from '../utils/dates';

/** GET /api/dashboard  - numbers and short lists for the home page */
export async function getDashboard(_req: Request, res: Response) {
  const [stats] = await query(
    `SELECT
       (SELECT COUNT(*) FROM products WHERE is_active = 1)                          AS totalProducts,
       (SELECT COUNT(*) FROM products WHERE is_active = 1 AND quantity <= reorder_level) AS lowStockCount,
       (SELECT COALESCE(SUM(quantity * cost), 0) FROM products)                     AS stockValue,
       (SELECT COUNT(*) FROM orders WHERE status = 'pending')                       AS pendingOrders,
       (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE())             AS ordersToday,
       (SELECT COALESCE(SUM(total), 0) FROM orders
         WHERE status <> 'cancelled'
           AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())) AS revenueThisMonth`,
  );

  const recentOrders = await query(
    `SELECT id, order_number AS orderNumber, customer_name AS customerName, status, total, created_at AS createdAt
       FROM orders ORDER BY created_at DESC, id DESC LIMIT 5`,
  );

  const lowStock = await query(
    `SELECT id, sku, name, quantity, reorder_level AS reorderLevel
       FROM products WHERE is_active = 1 AND quantity <= reorder_level
      ORDER BY quantity ASC LIMIT 5`,
  );

  // Sales for the last 7 days (days without sales are filled with 0).
  const salesRows = await query<{ day: string; total: number }>(
    `SELECT DATE(created_at) AS day, SUM(total) AS total
       FROM orders
      WHERE status <> 'cancelled' AND created_at >= CURDATE() - INTERVAL 6 DAY
      GROUP BY DATE(created_at)`,
  );
  const salesLast7Days = lastNDays(7).map((day) => ({
    date: day,
    total: Number(salesRows.find((row) => row.day === day)?.total ?? 0),
  }));

  res.json({ stats, recentOrders, lowStock, salesLast7Days });
}
