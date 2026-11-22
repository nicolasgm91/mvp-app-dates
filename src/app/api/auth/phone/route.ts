/**
 * Ruta de actualización del teléfono del usuario (primer contacto).
 * Anotación OpenAPI: PATCH /api/auth/phone — guarda el celular capturado al
 * crear la cuenta, el canal principal de comunicación del salón.
 */
import { handleUpdatePhone } from "@/server/modules/auth/auth.controller";
import { withErrorHandler } from "@/server/middlewares/error-handler";

export const PATCH = withErrorHandler(handleUpdatePhone);
