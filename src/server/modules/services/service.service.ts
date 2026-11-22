/**
 * Lógica de negocio del catálogo de servicios.
 * En el MVP el catálogo nace del seed; la creación via API queda para la
 * segunda iteración del proyecto.
 */
import { listActiveServices } from "./service.repository";

/** Devuelve los servicios activos listos para mostrar en la interfaz. */
export function getActiveServices() {
  return listActiveServices();
}
