/**
 * Capa de acceso a datos del catálogo de servicios estéticos.
 * Solo habla con Prisma: ninguna regla de negocio vive aquí.
 */
import { prisma } from "@/server/config/database";

/** Lista los servicios activos del catálogo, ordenados por nombre. */
export async function listActiveServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      price: true,
      isActive: true,
    },
  });
}
