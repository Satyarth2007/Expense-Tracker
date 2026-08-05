import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create a reusable connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon PostgreSQL SSL connections
  },
});

// Event listener for active pool connections
pool.on('connect', () => {
  console.log('⚡ Connected to Neon PostgreSQL database.');
});

// Global error handler for unexpected idle client errors
pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err);
  process.exit(-1);
});