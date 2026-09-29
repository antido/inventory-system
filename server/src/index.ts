// Entry point: checks the database connection, then starts the server.
import { app } from './app';
import { pool } from './config/db';
import { env } from './config/env';

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log(`Connected to MySQL database "${env.db.database}"`);
  } catch (error) {
    console.error('Could not connect to MySQL. Check the DB_* values in server/.env');
    console.error(error);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`API running at http://localhost:${env.port}/api`);
  });
}

start();
