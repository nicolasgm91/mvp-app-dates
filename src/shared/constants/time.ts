/**
 * Constantes de tiempo compartidas entre cliente y servidor.
 * Sin números mágicos: cada valor de negocio/técnico tiene nombre y comentario.
 */

/** Milisegundos en un minuto (conversión de duraciones de servicios). */
export const MS_PER_MINUTE = 60_000;

/** Timeout por defecto de las peticiones Axios del cliente (ms). */
export const AXIOS_TIMEOUT_MS = 15_000;

/** Tiempo de cache del JSON OpenAPI servido en /api/docs (segundos). */
export const SWAGGER_CACHE_MAX_AGE_SECONDS = 60;

/**
 * Tolerancia (en minutos) para aceptar reservas cuya hora ya empezó.
 * Existe para el registro presencial: el personal agenda al cliente que acaba
 * de llegar, con la hora actual; más allá de esa tolerancia la franja ya pasó.
 */
export const PAST_BOOKING_GRACE_MINUTES = 5;
