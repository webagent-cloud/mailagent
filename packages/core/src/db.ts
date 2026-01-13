// This file should only be imported in server-side code (Node.js)
// DO NOT import this in browser/client code

import 'dotenv/config';
import { PrismaClient, Prisma } from './generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Create the adapter for SQLite
const databaseUrl = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

// Singleton pattern for PrismaClient to avoid creating multiple instances
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export Prisma namespace for type helpers
export { Prisma };

// Re-export PrismaClient class for custom instantiation if needed
export { PrismaClient };
