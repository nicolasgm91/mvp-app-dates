"use client";

/**
 * Llamadas Axios del recurso CITAS para el historial del cliente.
 * La implementación vive en shared/api (única fuente de las llamadas HTTP).
 */
export {
  listUserAppointmentsRequest,
  cancelAppointmentRequest,
} from "@/client/shared/api/appointments.api";
