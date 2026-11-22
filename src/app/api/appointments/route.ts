/**
 * Rutas de reservas (citas).
 * Anotación OpenAPI: GET /api/appointments (filtros ?userId= y ?date=) y
 * POST /api/appointments (201 / 409 por cruce de franjas — ver /api/docs).
 */
import { handleCreateAppointment, handleListAppointments } from "@/server/modules/appointments/appointment.controller";
import { withErrorHandler } from "@/server/middlewares/error-handler";

export const GET = withErrorHandler(handleListAppointments);

export const POST = withErrorHandler(handleCreateAppointment);
