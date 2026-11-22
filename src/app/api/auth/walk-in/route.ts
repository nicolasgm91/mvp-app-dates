/**
 * Ruta de registro de clientes presenciales (walk-in).
 * Anotación OpenAPI: POST /api/auth/walk-in — el TELÉFONO es la llave de
 * identidad: si la persona ya está registrada devuelve su misma cuenta.
 */
import { handleWalkInRegister } from "@/server/modules/auth/auth.controller";
import { withErrorHandler } from "@/server/middlewares/error-handler";

export const POST = withErrorHandler(handleWalkInRegister);
