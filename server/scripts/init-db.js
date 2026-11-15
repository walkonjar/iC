import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
const conn = await mysql.createConnection({
  host: DB_HOST, port: Number(DB_PORT) || 3306, user: DB_USER, password: DB_PASSWORD,
  multipleStatements: true,
});
const db = conn.escapeId(DB_NAME);
await conn.query(`CREATE DATABASE IF NOT EXISTS ${db} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await conn.query(`USE ${db}`);
await conn.query(await readFile(new URL('../schema.sql', import.meta.url), 'utf8'));
console.log(`Database "${DB_NAME}" siap dipakai.`);
await conn.end();
