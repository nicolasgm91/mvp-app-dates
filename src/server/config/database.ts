/**
 * Instancia singleton de PrismaClient para toda la aplicación.
 * Se usa el adaptador oficial better-sqlite3 (Prisma 7 sin motor Rust) y la URL
 * viene del entorno, nunca hardcodeada (preparación para despliegue).
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// En desarrollo evitamos que el hot-reload de Next.js cree una conexión nueva
// en cada recarga: guardamos la instancia en el objeto global del proceso.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
