"use client";

/**
 * Llamadas Axios del feature de autenticación.
 * Toda petición HTTP del cliente pasa por la instancia central `apiClient`
 * (regla de la SPEC: sin fetch nativo).
 */
import { apiClient } from "@/client/core/api/axios.client";
import type {
  FederatedLoginPayload,
  UpdatePhonePayload,
} from "@/shared/contracts/auth.contract";
import type { AuthUser } from "@/client/core/context/AuthContext";

/** Registra o actualiza el usuario vía autenticación federada (simulada). */
export function federatedLoginRequest(payload: FederatedLoginPayload) {
  return apiClient.post<AuthUser>("/auth/federated", payload);
}

/** Guarda el teléfono capturado en el primer contacto (canal principal). */
export function updatePhoneRequest(payload: UpdatePhonePayload) {
  return apiClient.patch<AuthUser>("/auth/phone", payload);
}
