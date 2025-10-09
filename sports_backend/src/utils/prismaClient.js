import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import dotenv from 'dotenv';

dotenv.config();

// Create Prisma client based on URL type
let prisma;

if (process.env.DATABASE_URL?.startsWith('libsql://')) {
  console.log('Using libsql adapter for Turso...');
  console.log('Creating libsql client with:');
  console.log('URL:', process.env.DATABASE_URL);
  console.log('AuthToken length:', process.env.DATABASE_AUTH_TOKEN?.length || 0);

  const adapter = new PrismaLibSQL({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  prisma = new PrismaClient({ adapter });
} else {
  console.log('Using standard PrismaClient for local database...');
  prisma = new PrismaClient();
}

export default prisma;
