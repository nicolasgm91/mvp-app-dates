/**
 * Rutas del catálogo de servicios estéticos.
 * Anotación OpenAPI: GET /api/services — lista los servicios activos con su
 * duración dinámica y precio (ver /api/docs para el detalle).
 */
import { handleListServices } from "@/server/modules/services/service.controller";
import { withErrorHandler } from "@/server/middlewares/error-handler";

export const GET = withErrorHandler(handleListServices);
