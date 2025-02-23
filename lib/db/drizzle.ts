import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Remove dotenv import and config
// Remove process.env check

// For edge runtime, directly use the environment variable
const connectionString = process.env.POSTGRES_URL!;

// Configure postgres client with edge compatibility
const client = postgres(connectionString, { 
  prepare: false,  // Required for edge
  ssl: 'require'   // Enable if using secure connection
});

export const db = drizzle(client, { schema });