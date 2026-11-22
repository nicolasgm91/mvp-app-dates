/**
 * Capa de acceso a datos para usuarios (autenticación federada).
 * Solo habla con Prisma: ninguna regla de negocio vive aquí.
 */
import { prisma } from "@/server/config/database";
import { conflict, notFound } from "@/server/errors/app-error";
import type {
  FederatedLoginPayload,
  WalkInRegisterPayload,
} from "@/shared/contracts/auth.contract";

/**
 * Crea o actualiza (upsert) un usuario a partir de los datos del proveedor
 * de identidad federado. Si el email ya existe, refresca nombre, teléfono y
 * cuenta del proveedor; si no existe, lo crea como CLIENT.
 */
export async function upsertFederatedUser(payload: FederatedLoginPayload) {
  return prisma.user.upsert({
    where: { email: payload.email },
    update: {
      fullName: payload.fullName,
      // El teléfono entregado por el login no pisa uno ya registrado:
      // el capturado en el primer contacto es el canal principal del cliente.
      phone: payload.phone ?? undefined,
      authProvider: payload.authProvider,
      providerAccountId: payload.providerAccountId ?? null,
    },
    create: {
      email: payload.email,
      fullName: payload.fullName,
      phone: payload.phone ?? null,
      authProvider: payload.authProvider,
      providerAccountId: payload.providerAccountId ?? null,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      authProvider: true,
    },
  });
}

/**
 * Actualiza el teléfono de un usuario (capturado al crear su cuenta).
 * Lanza 404 si el usuario no existe y 409 si otro usuario ya tiene ese teléfono
 * (es la llave de identidad del cliente).
 */
export async function updateUserPhone(userId: string, phone: string) {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!existing) {
    throw notFound("Usuario no encontrado");
  }
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { phone },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        authProvider: true,
      },
    });
  } catch (error) {
    throw ifPhoneTaken(error);
  }
}

/**
 * Registra o reconoce a un cliente presencial por su TELÉFONO (llave de identidad).
 * - Teléfono nuevo: crea la cuenta CLIENT con un correo interno sintetizado a
 *   partir del propio teléfono (el correo real es opcional en el canal presencial).
 * - Teléfono conocido: devuelve la MISMA cuenta (la persona ya está registrada).
 */
export async function registerWalkInUser(payload: WalkInRegisterPayload) {
  const known = await prisma.user.findUnique({ where: { phone: payload.phone } });
  if (known) {
    // La persona vuelve: mismo registro, se refresca el nombre si cambió.
    if (known.fullName !== payload.fullName) {
      await prisma.user.update({
        where: { id: known.id },
        data: { fullName: payload.fullName },
      });
      return { ...known, fullName: payload.fullName };
    }
    return known;
  }

  // Cliente nuevo: el correo interno se deriva del teléfono (único por
  // construcción); si el cliente entregó correo real, se usa ese.
  const internalEmail =
    payload.email ?? `${payload.phone}@cliente.violeta`;

  try {
    return await prisma.user.create({
      data: {
        email: internalEmail,
        fullName: payload.fullName,
        phone: payload.phone,
        role: "CLIENT",
        authProvider: "GOOGLE",
        providerAccountId: `walk-in-${Date.now()}`,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        authProvider: true,
      },
    });
  } catch (error) {
    throw ifPhoneTaken(error);
  }
}

/** Traduce la violación del índice único de teléfono a un 409 legible. */
function ifPhoneTaken(error: unknown): Error | undefined {
  const code = (error as { code?: string }).code;
  if (code === "P2002") {
    return conflict("Ese número de teléfono ya está registrado con otra cuenta.");
  }
  return undefined;
}
