/**
 * Estados, canales y dirección física del Centro Estético Violeta.
 * Constantes de negocio compartidas: el modal de confirmación, la portada del
 * login y el panel administrativo leen la misma fuente de verdad.
 */

/** Canales por los que puede llegar una reserva al sistema. */
export const BOOKING_CHANNELS = {
  WEB: "WEB",
  IN_PERSON: "IN_PERSON",
} as const;

export type BookingChannel = (typeof BOOKING_CHANNELS)[keyof typeof BOOKING_CHANNELS];

/** Estados del ciclo de vida de una reserva. */
export const APPOINTMENT_STATES = {
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;

export type AppointmentState = keyof typeof APPOINTMENT_STATES;

/** Etiquetas en español para mostrar el estado en la interfaz. */
export const APPOINTMENT_STATE_LABELS: Record<AppointmentState, string> = {
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
};

/** Etiquetas en español para el canal de reserva en la interfaz. */
export const BOOKING_CHANNEL_LABELS: Record<BookingChannel, string> = {
  WEB: "En línea",
  IN_PERSON: "Presencial",
};

/**
 * Datos físicos del establecimiento. La Actividad 2 exige recordarle al cliente
 * la dirección antes de confirmar una cita web para asegurar su desplazamiento.
 */
export const SALON_LOCATION = {
  name: "Centro Estético Violeta",
  address: "Cra. 15 # 88-64, Local 3",
  neighborhood: "Chapinero",
  city: "Bogotá D.C., Colombia",
  fullAddress: "Cra. 15 # 88-64, Local 3, Chapinero, Bogotá D.C., Colombia",
  openingHours: "Lunes a sábado, 9:00 a.m. – 7:00 p.m.",
} as const;

/** Proveedores de identidad federada disponibles en la demo. */
export const FEDERATED_PROVIDERS = ["GOOGLE", "FACEBOOK", "APPLE"] as const;

export type FederatedProvider = (typeof FEDERATED_PROVIDERS)[number];
