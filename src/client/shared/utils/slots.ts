/**
 * Cálculo de franjas horarias compartido por la reserva del cliente y el
 * registro presencial del administrador. Una sola fuente de verdad para las
 * reglas de disponibilidad de la vista.
 */
import { MS_PER_MINUTE } from "@/shared/constants/time";

/** Franja base del día del salón: inicio y fin de la jornada. */
export const SCHEDULE_START_HOUR = 9;
export const SCHEDULE_END_HOUR = 18;
/** Separación entre franjas ofrecidas (30 minutos). */
export const SLOT_STEP_MINUTES = 30;

/** Duración por defecto para previsualizar franjas antes de elegir servicios. */
export const DEFAULT_PREVIEW_DURATION = 60;

/** Representación de una franja horaria de la grilla. */
export type Slot = {
  /** Fecha de inicio de la franja. */
  start: Date;
  /** Representación local legible (ej. "10:30"). */
  label: string;
  available: boolean;
};

type BuildSlotsOptions = {
  /**
   * Minutos de tolerancia hacia el pasado: permite seleccionar la franja que
   * acaba de empezar (para que el personal registre al cliente que llega ahora).
   */
  recentPastMinutes?: number;
  /**
   * Permite TODAS las franjas ya iniciadas del día (canal presencial: el
   * personal tiene discreción, puede registrar al cliente aunque el turno
   * haya comenzado hace rato — en el ajetreo se pierde la noción del tiempo).
   */
  allowPast?: boolean;
};

/**
 * Construye la grilla de franjas del día marcando las ocupadas.
 * Reglas de disponibilidad:
 * 1. No se ofrecen franjas de HOY cuya hora ya empezó (a las 8 p.m. la 10 a.m.
 *    de hoy ya no está disponible), salvo la tolerancia `recentPastMinutes`.
 * 2. Una franja está ocupada si se cruza con una reserva CONFIRMED:
 *    slotStart < appointmentEnd && slotEnd > appointmentStart
 *    (slotEnd considera la duración TOTAL del combo a reservar).
 */
export function buildSlotsFor(
  date: string,
  appointments: { startTime: string; endTime: string; status: string }[],
  durationMinutes: number,
  options?: BuildSlotsOptions,
): Slot[] {
  const dayStart = new Date(`${date}T00:00:00`);
  const confirmed = appointments.filter((appointment) => appointment.status === "CONFIRMED");

  const nowMs = Date.now();
  const graceLimit =
    options?.recentPastMinutes !== undefined
      ? nowMs - options.recentPastMinutes * MS_PER_MINUTE
      : nowMs;

  const slots: Slot[] = [];
  for (
    let minutes = SCHEDULE_START_HOUR * 60;
    minutes < SCHEDULE_END_HOUR * 60;
    minutes += SLOT_STEP_MINUTES
  ) {
    const start = new Date(dayStart);
    start.setMinutes(minutes);
    const slotEnd = new Date(start.getTime() + durationMinutes * MS_PER_MINUTE);

    // Canal presencial (allowPast): sin restricción de horas atrasadas.
    const isSelectable = options?.allowPast === true || start.getTime() >= graceLimit;
    const available =
      isSelectable &&
      !confirmed.some((appointment) => {
        const appointmentStart = new Date(appointment.startTime);
        const appointmentEnd = new Date(appointment.endTime);
        return start < appointmentEnd && slotEnd > appointmentStart;
      });

    slots.push({
      start,
      label: start.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }),
      available,
    });
  }
  return slots;
}
