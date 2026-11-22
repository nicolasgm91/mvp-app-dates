/**
 * Capa de acceso a datos de reservas (citas).
 * Solo habla con Prisma: ninguna regla de negocio vive aquí.
 */
import { prisma } from "@/server/config/database";

const appointmentInclude = {
  user: {
    select: { id: true, email: true, fullName: true, role: true, phone: true },
  },
  service: {
    select: { id: true, name: true, durationMinutes: true, price: true },
  },
} as const;

type AppointmentFilters = {
  userId?: string;
  /** Fecha en formato YYYY-MM-DD; filtra las reservas de ese día. */
  date?: string;
};

/**
 * Lista reservas aplicando filtros opcionales de usuario y/o fecha.
 * La fecha se interpreta en hora local del servidor (día natural del salón).
 */
export async function listAppointments(filters: AppointmentFilters) {
  const where: {
    userId?: string;
    startTime?: { gte: Date; lt: Date };
  } = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.date) {
    // Construye el rango [00:00, 24:00) del día solicitado en hora local.
    const dayStart = new Date(`${filters.date}T00:00:00`);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    where.startTime = { gte: dayStart, lt: dayEnd };
  }

  return prisma.appointment.findMany({
    where,
    include: appointmentInclude,
    orderBy: { startTime: "asc" },
  });
}

/**
 * Busca la primera reserva CONFIRMED cuya franja se cruce con el rango dado.
 * Condición de solapamiento clásica de intervalos:
 *   existing.startTime < newEnd  &&  existing.endTime > newStart
 */
export function findConflictingAppointment(newStart: Date, newEnd: Date) {
  return prisma.appointment.findFirst({
    where: {
      status: "CONFIRMED",
      startTime: { lt: newEnd },
      endTime: { gt: newStart },
    },
    include: appointmentInclude,
  });
}

/**
 * Busca una reserva por su identificador, con usuario y servicio incluidos.
 */
export function findAppointmentById(id: string) {
  return prisma.appointment.findUnique({ where: { id }, include: appointmentInclude });
}

/** Busca un servicio ACTIVO del catálogo con su duración parametrizada. */
export function findActiveServiceById(serviceId: string) {
  return prisma.service.findFirst({
    where: { id: serviceId, isActive: true },
    select: { durationMinutes: true },
  });
}

/** Crea la reserva una vez que la capa de negocio validó todo. */
export function createAppointment(data: {
  userId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  channel: "WEB" | "IN_PERSON";
  locationConfirmed: boolean;
  notes?: string;
}) {
  return prisma.appointment.create({
    data,
    include: appointmentInclude,
  });
}

/**
 * Cancela una reserva cambiando su estado a CANCELLED (no se borra: queda en el
 * historial del cliente y la franja horaria queda liberada de inmediato).
 */
export function cancelAppointment(id: string) {
  return prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: appointmentInclude,
  });
}
