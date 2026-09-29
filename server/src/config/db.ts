// MySQL connection pool + small helpers so controllers stay short.
import mysql, { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { env } from './env';

export const pool = mysql.createPool({
  ...env.db,
  connectionLimit: 10,
  decimalNumbers: true, // return DECIMAL columns as numbers instead of strings
  dateStrings: true, // return dates as 'YYYY-MM-DD HH:MM:SS' strings
});

/** Run a SELECT and get the rows back. */
export async function query<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/** Run an INSERT / UPDATE / DELETE and get info like insertId and affectedRows. */
export async function execute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [result] = await pool.query(sql, params);
  return result as ResultSetHeader;
}

/**
 * Run several queries as one transaction: either all succeed or none do.
 * If the callback throws, every change is rolled back.
 */
export async function withTransaction<T>(work: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
