import "dotenv/config";
import { defineConfig } from "prisma/config";

// Configuración del CLI de Prisma 7: el schema, las migraciones, el seed y la
// URL de la base de datos ya no viven en package.json ni solo en el schema.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: `tsx prisma/seed.ts`,
  },
  datasource: {
    // Fallback explícito para la demo: si no existe .env, SQLite vive en la raíz.
    url: process.env["DATABASE_URL"] ?? "file:./dev.db",
  },
});
