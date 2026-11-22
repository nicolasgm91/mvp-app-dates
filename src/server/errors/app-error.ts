/**
 * Clase de error HTTP personalizada del backend.
 * Permite a los servicios y repositorios señalar fallos de negocio con su código
 * HTTP correcto, sin que la capa de rutas conozca los detalles internos.
 */
export class AppError extends Error {
  /** Código HTTP que debe devolver la respuesta (400, 404, 409, ...). */
  readonly statusCode: number;

  /**
   * @param message Mensaje seguro para el usuario (se muestra tal cual en la respuesta).
   * @param statusCode Código HTTP asociado al fallo de negocio.
   */
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

/** 400 Bad Request: datos de entrada inválidos. */
export function badRequest(message: string): AppError {
  return new AppError(message, 400);
}

/** 404 Not Found: el recurso solicitado no existe. */
export function notFound(message: string): AppError {
  return new AppError(message, 404);
}

/** 409 Conflict: la operación choca con el estado actual del negocio (ej. cruce de horarios). */
export function conflict(message: string): AppError {
  return new AppError(message, 409);
}
