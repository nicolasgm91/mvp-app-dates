/**
 * Contrato de autenticación federada (simulada) compartido entre cliente y servidor.
 * El cliente envía los datos que un proveedor de identidad entregaría tras el login,
 * y el servidor valida y hace upsert del usuario en la base de datos.
 */
import { z } from "zod";

/** Regla de teléfono compartida: solo dígitos, entre 7 y 10 (celular en Colombia). */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{7,10}$/, "El teléfono admite solo números, entre 7 y 10 dígitos.");

/**
 * Esquema de inicio de sesión federado.
 * - email y fullName provienen del proveedor de identidad.
 * - phone sigue la misma regla de solo dígitos (7 a 10) que todo el sistema.
 * - providerAccountId es el identificador del usuario en el proveedor (opcional en demo).
 */
export const federatedLoginSchema = z.object({
  email: z.email("El correo electrónico no es válido."),
  fullName: z.string().trim().min(1, "El nombre completo es obligatorio."),
  authProvider: z.enum(["GOOGLE", "FACEBOOK", "APPLE"]),
  providerAccountId: z.string().trim().min(1).optional(),
  phone: phoneSchema.optional(),
});

/** Tipo inferido del payload de login federado (DTO compartido). */
export type FederatedLoginPayload = z.infer<typeof federatedLoginSchema>;

/**
 * Esquema de actualización del teléfono del usuario autenticado.
 * Regla de negocio: el celular es el principal canal de comunicación del salón,
 * por eso se solicita al crear la cuenta y se puede corregir después.
 */
export const updatePhoneSchema = z.object({
  userId: z.string().trim().min(1, "El usuario es obligatorio."),
  phone: phoneSchema,
});

/** Tipo inferido del payload de actualización de teléfono (DTO compartido). */
export type UpdatePhonePayload = z.infer<typeof updatePhoneSchema>;

/**
 * Esquema de registro de cliente presencial (walk-in).
 * Regla de negocio: el TELÉFONO es la llave de identidad del cliente —
 * la misma persona que vuelve se reconoce por su celular, no por un correo.
 * El correo es opcional (algunos clientes presenciales no lo entregan).
 */
export const walkInRegisterSchema = z.object({
  fullName: z.string().trim().min(1, "El nombre completo es obligatorio."),
  phone: phoneSchema,
  email: z.email("El correo electrónico no es válido.").optional(),
});

/** Tipo inferido del payload de registro presencial (DTO compartido). */
export type WalkInRegisterPayload = z.infer<typeof walkInRegisterSchema>;
