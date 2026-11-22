/**
 * Contrato del catálogo de servicios estéticos compartido entre cliente y servidor.
 * El administrador crea servicios con duración dinámica; esa duración alimenta
 * el cálculo de disponibilidad del motor de agendamiento.
 */
import { z } from "zod";

/**
 * Esquema de creación de un servicio del catálogo.
 * - durationMinutes: entre 15 y 240 minutos (regla de negocio del salón).
 * - price: precio en COP, número positivo.
 */
export const createServiceSchema = z.object({
  name: z.string().trim().min(1, "El nombre del servicio es obligatorio."),
  description: z.string().trim().min(1).optional(),
  durationMinutes: z
    .number()
    .int("La duración debe ser un número entero de minutos.")
    .min(15, "La duración mínima es de 15 minutos.")
    .max(240, "La duración máxima es de 240 minutos."),
  price: z
    .number()
    .positive("El precio debe ser un valor positivo."),
});

/** Tipo inferido del payload de creación de servicio (DTO compartido). */
export type CreateServicePayload = z.infer<typeof createServiceSchema>;
