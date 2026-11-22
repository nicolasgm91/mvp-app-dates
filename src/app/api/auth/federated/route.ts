/**
 * Ruta de autenticación federada (simulada en el MVP).
 * Anotación OpenAPI: POST /api/auth/federated — valida el payload del proveedor
 * de identidad y realiza upsert del usuario (ver /api/docs para el detalle).
 */
import { handleFederatedLogin } from "@/server/modules/auth/auth.controller";
import { withErrorHandler } from "@/server/middlewares/error-handler";

export const POST = withErrorHandler(handleFederatedLogin);
