"use client";

/**
 * Llamadas Axios del recurso SERVICIOS, compartidas por todos los features
 * (booking, admin). Vive en shared para evitar dependencias cruzadas entre
 * features: ningún feature debe importar el api de otro.
 */
import { apiClient } from "@/client/core/api/axios.client";

/** Servicio del catálogo con duración dinámica (respuesta del API). */
export type ServiceDto = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  isActive: boolean;
};

/** Lista los servicios activos del catálogo. */
export function listServicesRequest() {
  return apiClient.get<ServiceDto[]>("/services");
}
