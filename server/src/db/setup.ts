// Creates the database, runs schema.sql and inserts sample data.
// Run with:  npm run db:setup
// WARNING: this deletes all existing data in the database.
import bcrypt from 'bcryptjs';
import fs from 'fs';
import mysql, { ResultSetHeader } from 'mysql2/promise';
import path from 'path';
import { env } from '../config/env';
import { withTransaction } from '../config/db';
import { createOrderRecord } from '../services/orders';
import { changeStock } from '../services/stock';
import { CATEGORIES, CUSTOMERS, PRIVILEGES, PRODUCTS, ROLES, USERS } from './seed-data';

async function main() {
  // 1. Create the database if it doesn't exist yet.
  const { database, ...connectionSettings } = env.db;
  const conn = await mysql.createConnection({ ...connectionSettings, multipleStatements: true });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await conn.query(`USE \`${database}\``);
  console.log(`Using database "${database}"`);

  // 2. Create all tables.
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await conn.query(schema);
  console.log('Tables created');

  // 3. Privileges and roles.
  const privilegeIds: Record<string, number> = {};
  for (const p of PRIVILEGES) {
    const [result] = await conn.query<ResultSetHeader>(
      'INSERT INTO privileges (name, module, description) VALUES (?, ?, ?)',
      [p.name, p.module, p.description],
    );
    privilegeIds[p.name] = result.insertId;
  }

  const roleIds: Record<string, number> = {};
  for (const role of ROLES) {
    const [result] = await conn.query<ResultSetHeader>(
      'INSERT INTO roles (name, description, is_system) VALUES (?, ?, ?)',
      [role.name, role.description, role.isSystem],
    );
    roleIds[role.name] = result.insertId;
    for (const privilege of role.privileges) {
      await conn.query('INSERT INTO role_privileges (role_id, privilege_id) VALUES (?, ?)', [
        result.insertId,
        privilegeIds[privilege],
      ]);
    }
  }
  console.log(`Added ${PRIVILEGES.length} privileges and ${ROLES.length} roles`);

  // 4. Users (passwords are hashed, never stored as plain text).
  const userIds: number[] = [];
  for (const user of USERS) {
    const [result] = await conn.query<ResultSetHeader>(
      'INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
      [user.name, user.email, await bcrypt.hash(user.password, 10), roleIds[user.role]],
    );
    userIds.push(result.insertId);
  }
  console.log(`Added ${USERS.length} users`);

  // 5. Categories and products (no stock yet - added below as movements).
  const categoryIds: Record<string, number> = {};
  for (const category of CATEGORIES) {
    const [result] = await conn.query<ResultSetHeader>('INSERT INTO categories (name, description) VALUES (?, ?)', [
      category.name,
      category.description,
    ]);
    categoryIds[category.name] = result.insertId;
  }

  const productIds: number[] = [];
  for (const p of PRODUCTS) {
    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO products (sku, name, category_id, price, cost, reorder_level)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [p.sku, p.name, categoryIds[p.category], p.price, p.cost, p.reorderLevel],
    );
    productIds.push(result.insertId);
  }
  await conn.end();
  console.log(`Added ${CATEGORIES.length} categories and ${PRODUCTS.length} products`);

  // 6. Opening stock, dated 31 days ago. Extra units are added because
  //    the sample orders below will use some of them.
  const adminId = userIds[0];
  const openingDate = new Date();
  openingDate.setDate(openingDate.getDate() - 31);
  await withTransaction(async (tx) => {
    for (const productId of productIds) {
      await changeStock(tx, { productId, change: 100, type: 'in', note: 'Opening stock', userId: adminId });
    }
    await tx.query('UPDATE stock_movements SET created_at = ?', [openingDate]);
  });

  // 7. Sample orders spread over the last 30 days so reports have data.
  let orderCount = 0;
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const ordersToday = daysAgo % 3 === 0 ? 2 : 1;
    for (let n = 0; n < ordersToday; n++) {
      // `daysAgo` days back, minus a few hours for the second order of the day.
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(createdAt.getHours() - n * 2);

      const firstProduct = (daysAgo + n) % productIds.length;
      const items = [
        { productId: productIds[firstProduct], quantity: 1 + (daysAgo % 3) },
        { productId: productIds[(firstProduct + 5) % productIds.length], quantity: 1 },
      ];

      await withTransaction(async (tx) => {
        const userId = userIds[(daysAgo + n) % userIds.length];
        const orderId = await createOrderRecord(tx, {
          customerName: CUSTOMERS[(daysAgo + n) % CUSTOMERS.length],
          items,
          userId,
          createdAt,
        });
        const orderNumber = `ORD-${String(orderId).padStart(5, '0')}`;

        // Older orders are completed, a few are cancelled, recent ones stay pending.
        const status = daysAgo > 2 ? (daysAgo % 11 === 0 ? 'cancelled' : 'completed') : 'pending';
        if (status === 'cancelled') {
          for (const item of items) {
            await changeStock(tx, {
              productId: item.productId,
              change: item.quantity,
              type: 'return',
              note: `Cancelled ${orderNumber}`,
              userId,
            });
          }
        }
        await tx.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
        // Date the stock movements of this order on the order date.
        await tx.query('UPDATE stock_movements SET created_at = ? WHERE note LIKE ?', [
          createdAt,
          `%${orderNumber}`,
        ]);
      });
      orderCount++;
    }
  }
  console.log(`Added ${orderCount} sample orders`);

  // 8. A stock count today sets every product to its quantity from seed-data.ts
  //    (so some products show up as "low stock" on the dashboard).
  await withTransaction(async (tx) => {
    for (let i = 0; i < PRODUCTS.length; i++) {
      const [rows]: any = await tx.query('SELECT quantity FROM products WHERE id = ?', [productIds[i]]);
      await changeStock(tx, {
        productId: productIds[i],
        change: PRODUCTS[i].quantity - rows[0].quantity,
        type: 'adjustment',
        note: 'Stock count',
        userId: adminId,
      });
    }
  });

  console.log('\nDone! Log in with one of these accounts:');
  for (const user of USERS) console.log(`  ${user.role.padEnd(8)} ${user.email} / ${user.password}`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Database setup failed:', error.message);
  process.exit(1);
});
