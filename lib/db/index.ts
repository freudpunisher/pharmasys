
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '../db/schema'; // Import your schema from lib/schema.ts

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:your_password@localhost:5432/my_v0_project',
});

client.connect();
export const db = drizzle(client, { schema });