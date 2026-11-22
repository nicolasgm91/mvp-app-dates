"use client";

/**
 * Llamadas Axios propias del panel administrativo. Las llamadas de recursos
 * compartidos (servicios, citas) viven en shared/api para evitar dependencias
 * cruzadas entre features; aquí queda solo lo exclusivo del admin.
 */
import { apiClient } from "@/client/core/api/axios.client";
import type { AuthUser } from "@/client/core/context/AuthContext";

/**
 * Registra (o reconoce por teléfono) al cliente presencial para obtener su userId.
 * El backend decide: si el teléfono ya existe devuelve la misma cuenta; si no,
 * crea una nueva con correo interno derivado del teléfono.
 */
export function registerWalkInClientRequest(payload: {
  fullName: string;
  phone: string;
  email?: string;
}) {
  return apiClient.post<AuthUser>("/auth/walk-in", payload);
}
