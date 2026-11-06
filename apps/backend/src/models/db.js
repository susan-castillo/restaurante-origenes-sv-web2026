import pkg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const { Pool } = pkg;

// 1. Crear el pool de conexión con PostgreSQL utilizando la URL de .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// 2. Instanciar el adaptador de Prisma
const adapter = new PrismaPg(pool);

// 3. Crear e instanciar el cliente con el adaptador
export const prisma = new PrismaClient({ adapter });

// 4. Exportación por defecto para mantener compatibilidad total con authController.js
export default prisma;