"use client";

/**
 * Instancia centralizada de Axios para TODAS las peticiones HTTP del cliente.
 * Regla estricta de la SPEC: prohibido el `fetch` nativo en el cliente —
 * toda llamada pasa por `apiClient`.
 *
 * - baseURL relativa ("/api"): nada de localhost quemado, listo para desplegar.
 * - Interceptor de errores: extrae el mensaje legible que el backend devuelve
 *   en error.response.data.message (del AppError / withErrorHandler) para que
 *   los hooks y vistas muestren alertas en español, no stack traces.
 */
import axios from "axios";
import { AXIOS_TIMEOUT_MS } from "@/shared/constants/time";
import type { AxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: AXIOS_TIMEOUT_MS,
});

/**
 * Interceptor de respuesta: normaliza el error HTTP a un Error con el mensaje
 * del backend. Los features consumen `apiClient` y reciben errores listos para
 * mostrar en el AlertBanner.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: { field: string; reason: string }[] }>) => {
    const backendMessage = error.response?.data?.message;
    const validationDetails = error.response?.data?.errors
      ?.map((issue) => issue.reason)
      .join(" ");

    const message = backendMessage
      ? validationDetails
        ? `${backendMessage} ${validationDetails}`
        : backendMessage
      : "No fue posible comunicarse con el servidor. Verifica tu conexión e intenta de nuevo.";

    return Promise.reject(attachStatus(new Error(message), error.response?.status));
  },
);

/**
 * Adjunta el código HTTP al error: los hooks pueden distinguir un 409 (cruce
 * de horarios, accionable) de un 500 (falla del servidor, no accionable) sin
 * depender del texto del mensaje.
 */
function attachStatus(error: Error, status?: number): Error & { status?: number } {
  const errorWithStatus = error as Error & { status?: number };
  if (status !== undefined) {
    errorWithStatus.status = status;
  }
  return errorWithStatus;
}
