/**
 * Normalización previa a la migración "teléfono como identidad":
 * - deja el teléfono solo con dígitos (quita espacios, +57, etc.),
 * - si varios usuarios comparten el mismo teléfono tras normalizar,
 *   conserva el teléfono solo en el más reciente y pone null en los demás
 *   (el índice único exige valores distintos).
 * Uso: pnpm exec tsx prisma/normalize-phones.ts
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const digits = (value: string) => value.replace(/\D/g, "");

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, phone: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const seen = new Map<string, string>();
  let normalized = 0;
  let released = 0;

  for (const user of users) {
    if (!user.phone) continue;
    const clean = digits(user.phone);
    if (clean !== user.phone) {
      await prisma.user.update({ where: { id: user.id }, data: { phone: clean } });
      normalized += 1;
    }
    if (seen.has(clean)) {
      // Duplicado tras normalizar: el registro más antiguo conserva el teléfono.
      await prisma.user.update({ where: { id: user.id }, data: { phone: null } });
      released += 1;
      console.log(`Duplicado liberado: ${user.email} (tel. ${clean})`);
    } else {
      seen.set(clean, user.id);
    }
  }

  console.log(
    `Usuarios: ${users.length} | con teléfono: ${seen.size} | normalizados: ${normalized} | liberados: ${released}`,
  );
}

main()
  .catch((error) => {
    console.error("Error normalizando teléfonos:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
