/**
 * Controlador del catálogo de servicios.
 * Traduce HTTP ↔ dominio y documenta el endpoint para Swagger.
 */
import { NextResponse } from "next/server";
import { getActiveServices } from "./service.service";

/**
 * Maneja GET /api/services devolviendo los servicios activos del catálogo.
 * En el MVP el catálogo se siembra con `prisma db seed`.
 */
export async function handleListServices() {
  const services = await getActiveServices();
  return NextResponse.json(services, { status: 200 });
}
