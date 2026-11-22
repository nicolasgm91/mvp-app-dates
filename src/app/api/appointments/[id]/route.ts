/**
 * Ruta de cancelación de una reserva específica.
 * Anotación OpenAPI: DELETE /api/appointments/{id} — 200 si cancela, 404 si no
 * existe (ver /api/docs para el detalle).
 */
import { NextResponse } from "next/server";
import { cancelUserAppointment } from "@/server/modules/appointments/appointment.service";
import { withErrorHandler } from "@/server/middlewares/error-handler";

// Nota de Next.js moderno: los params de rutas dinámicas llegan como promesa.
type RouteContext = { params: Promise<{ id: string }> };

export const DELETE = withErrorHandler(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const appointment = await cancelUserAppointment(id);
  return NextResponse.json(appointment, { status: 200 });
});
