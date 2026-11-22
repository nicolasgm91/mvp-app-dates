"use client";

/**
 * Llamadas Axios del recurso CITAS, compartidas por todos los features
 * (booking, admin, my-appointments). Vive en shared para evitar dependencias
 * cruzadas entre features: ningún feature debe importar el api de otro.
 */
import { apiClient } from "@/client/core/api/axios.client";
import type { AppointmentResponse, CreateAppointmentPayload } from "@/shared/contracts/appointment.contract";

/** Lista las reservas de una fecha (YYYY-MM-DD) para calcular disponibilidad. */
export function listAppointmentsByDateRequest(date: string) {
  return apiClient.get<AppointmentResponse[]>("/appointments", {
    params: { date },
  });
}

/** Lista las reservas de un usuario específico (historial del cliente). */
export function listUserAppointmentsRequest(userId: string) {
  return apiClient.get<AppointmentResponse[]>("/appointments", {
    params: { userId },
  });
}

/** Crea una reserva (WEB o presencial). El backend responde 201 o 409. */
export function createAppointmentRequest(payload: CreateAppointmentPayload) {
  return apiClient.post<AppointmentResponse>("/appointments", payload);
}

/** Cancela una reserva (DELETE): el backend cambia su estado a CANCELLED. */
export function cancelAppointmentRequest(appointmentId: string) {
  return apiClient.delete<AppointmentResponse>(`/appointments/${appointmentId}`);
}
