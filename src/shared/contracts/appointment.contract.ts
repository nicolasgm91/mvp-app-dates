/**
 * Contrato de reservas (citas) compartido entre cliente y servidor.
 * Aquí vive la regla de negocio central de la Actividad 2: ninguna reserva web
 * puede confirmarse sin que el cliente haya aceptado la dirección física del salón.
 */
import { z } from "zod";

/**
 * Esquema de creación de una reserva.
 * - startTime: fecha y hora de inicio en formato ISO (datetime local con offset).
 * - channel: WEB (cliente remoto autogestiona) o IN_PERSON (turno presencial del salón).
 * - locationConfirmed: el refine de abajo la exige true cuando el canal es WEB.
 */
export const createAppointmentSchema = z
  .object({
    userId: z.string().trim().min(1, "El usuario de la reserva es obligatorio."),
    serviceId: z
      .string()
      .trim()
      .min(1, "El servicio seleccionado es obligatorio."),
    startTime: z.iso.datetime("La fecha de inicio debe ser una fecha ISO válida."),
    channel: z.enum(["WEB", "IN_PERSON"]),
    locationConfirmed: z.boolean(),
    notes: z.string().trim().min(1).optional(),
  })
  .refine(
    (payload) => payload.channel !== "WEB" || payload.locationConfirmed === true,
    {
      message:
        "Debe confirmar la dirección física del establecimiento antes de reservar en línea.",
      path: ["locationConfirmed"],
    },
  );

/** Tipo inferido del payload de creación de reserva (DTO compartido). */
export type CreateAppointmentPayload = z.infer<typeof createAppointmentSchema>;

/**
 * Esquema para las respuestas del API de citas.
 * Se define aquí para que el cliente tipifique las peticiones Axios con el mismo
 * contrato que el servidor (una sola fuente de verdad).
 */
export const appointmentResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  serviceId: z.string(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
  channel: z.enum(["WEB", "IN_PERSON"]),
  locationConfirmed: z.boolean(),
  notes: z.string().nullable().optional(),
  user: z.object({
    id: z.string(),
    email: z.email(),
    fullName: z.string(),
    role: z.enum(["CLIENT", "ADMIN"]),
    phone: z.string().nullable(),
  }),
  service: z.object({
    id: z.string(),
    name: z.string(),
    durationMinutes: z.number().int(),
    price: z.number(),
  }),
});

/** Tipo inferido de la respuesta de una cita (DTO compartido). */
export type AppointmentResponse = z.infer<typeof appointmentResponseSchema>;
