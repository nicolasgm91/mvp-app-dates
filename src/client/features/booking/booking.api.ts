"use client";

/**
 * Llamadas Axios del recurso CITAS re-exportadas para el feature de reserva.
 * La implementación vive en shared/api (única fuente); los features consumen
 * desde aquí o directamente de shared según su comodidad.
 */
export {
  listAppointmentsByDateRequest,
  createAppointmentRequest,
  cancelAppointmentRequest,
} from "@/client/shared/api/appointments.api";
export type { ServiceDto } from "@/client/shared/api/services.api";
export { listServicesRequest } from "@/client/shared/api/services.api";
