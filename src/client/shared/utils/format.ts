/**
 * Utilitarios de formato compartidos por los features del cliente.
 */

/** Formatea un valor numérico como precio en pesos colombianos (COP). */
export function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
