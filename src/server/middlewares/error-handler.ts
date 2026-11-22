/**
 * Manejo centralizado de errores para todos los Route Handlers de Next.js.
 * Cualquier controlador se envuelve con `withErrorHandler` y recibe una
 * respuesta JSON coherente ante los tres tipos de fallo:
 *
 * 1. ZodError  -> 400 Bad Request con el detalle del campo inválido (validación).
 * 2. AppError  -> el código HTTP de negocio definido por el servicio (404, 409...).
 * 3. Otros     -> 500 con mensaje seguro en español (nunca filtra detalles internos).
 */
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/server/errors/app-error";

type HandlerContext<P = unknown> = {
  params: Promise<P>;
};

type RouteHandler<P = unknown> = (
  request: Request,
  context: HandlerContext<P>,
) => Promise<NextResponse | Response>;

/**
 * Envuelve un Route Handler y transforma cualquier excepción en una respuesta
 * HTTP consistente para el cliente.
 */
export function withErrorHandler<P = unknown>(handler: RouteHandler<P>) {
  return async (request: Request, context: HandlerContext<P>) => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Validación de contratos Zod: devolvemos el campo y el motivo exacto.
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            message: "Datos de entrada inválidos.",
            errors: error.issues.map((issue) => ({
              field: issue.path.join("."),
              reason: issue.message,
            })),
          },
          { status: 400 },
        );
      }

      // Error de negocio deliberado: se respeta su código y su mensaje.
      if (error instanceof AppError) {
        return NextResponse.json(
          { message: error.message },
          { status: error.statusCode },
        );
      }

      // Fallo no controlado: se registra en el servidor y se responde sin exponer
      // detalles internos (rutas de archivos, queries, stack traces, etc.).
      console.error("[error-handler] Error no controlado:", error);
      return NextResponse.json(
        { message: "Ocurrió un error interno del servidor. Intenta de nuevo más tarde." },
        { status: 500 },
      );
    }
  };
}
