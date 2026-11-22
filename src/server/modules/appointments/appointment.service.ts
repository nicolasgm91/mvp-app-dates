/**
 * Lógica de negocio de reservas.
 * Aquí vive el algoritmo central de la Actividad 2: agendamiento con
 * concurrencia validada contra una única agenda centralizada.
 */
import type { CreateAppointmentPayload } from "@/shared/contracts/appointment.contract";
import { badRequest, conflict, notFound } from "@/server/errors/app-error";
import { MS_PER_MINUTE, PAST_BOOKING_GRACE_MINUTES } from "@/shared/constants/time";
import {
  createAppointment,
  cancelAppointment,
  findActiveServiceById,
  findAppointmentById,
  findConflictingAppointment,
  listAppointments,
} from "./appointment.repository";

/** Lista reservas con los filtros ya normalizados por el controlador. */
export function getAppointments(filters: { userId?: string; date?: string }) {
  return listAppointments(filters);
}

/**
 * Crea una reserva aplicando las reglas de negocio del salón:
 *
 * 1. El servicio debe existir y estar activo (404 si no).
 * 2. El endTime se calcula con la duración dinámica del servicio
 *    (no se confía en el cliente para calcular el fin de la cita).
 * 3. No puede existir una reserva CONFIRMED que se cruce con la franja
 *    solicitada (409 Conflict si la hay): es lo que garantiza la equidad
 *    entre el canal web y el canal presencial en la misma agenda.
 */
export async function bookAppointment(payload: CreateAppointmentPayload) {
  // 1. El servicio debe existir y estar activo (consulta vía repository).
  const service = await findActiveServiceById(payload.serviceId);
  if (!service) {
    throw notFound("El servicio seleccionado no existe");
  }

  // 2. Fin de la cita según la duración parametrizada del servicio.
  const startTime = new Date(payload.startTime);
  const endTime = new Date(startTime.getTime() + service.durationMinutes * MS_PER_MINUTE);

  // 3. Regla temporal (solo canal WEB): el cliente remoto no puede reservar
  //    una franja que ya pasó. El canal IN_PERSON queda a discreción del
  //    personal: en el ajetreo del salón se pierde la noción del tiempo y el
  //    turno del cliente que llegó hace un rato se registra igual.
  if (payload.channel === "WEB") {
    const graceLimit = Date.now() - PAST_BOOKING_GRACE_MINUTES * MS_PER_MINUTE;
    if (startTime.getTime() < graceLimit) {
      throw badRequest(
        "No es posible reservar una franja que ya pasó. Selecciona una hora disponible de hoy o una fecha futura.",
      );
    }
  }

  // 4. Validación de cruce contra la agenda centralizada (canal agnóstico).
  const conflictAppointment = await findConflictingAppointment(startTime, endTime);
  if (conflictAppointment) {
    throw conflict(
      "La franja horaria seleccionada se cruza con otra reserva existente.",
    );
  }

  return createAppointment({
    userId: payload.userId,
    serviceId: payload.serviceId,
    startTime,
    endTime,
    channel: payload.channel,
    locationConfirmed: payload.locationConfirmed,
    notes: payload.notes,
  });
}

/**
 * Cancela una reserva. La franja se libera de inmediato porque el validador de
 * cruces solo considera reservas CONFIRMED.
 */
export async function cancelUserAppointment(id: string) {
  const appointment = await findAppointmentById(id);
  if (!appointment) {
    throw notFound("Reserva no encontrada");
  }
  return cancelAppointment(id);
}
