// archivo de configuración global de la CLI de Prisma
// Con esto se nos permite usar los comandos de Prima como:
// npx prisma db pull o npx prisma generate
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env.DATABASE_URL },
});