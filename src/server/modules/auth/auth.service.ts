/**
 * Lógica de negocio de autenticación federada (simulada en el MVP).
 * El upsert es idempotente: entrar dos veces con la misma cuenta no duplica usuarios.
 */
import type {
  FederatedLoginPayload,
  UpdatePhonePayload,
  WalkInRegisterPayload,
} from "@/shared/contracts/auth.contract";
import {
  registerWalkInUser,
  upsertFederatedUser,
  updateUserPhone,
} from "./auth.repository";

/** Registra o actualiza el usuario y devuelve sus datos públicos. */
export function federatedLogin(payload: FederatedLoginPayload) {
  return upsertFederatedUser(payload);
}

/** Guarda el teléfono capturado en el primer contacto del usuario. */
export function saveUserPhone(payload: UpdatePhonePayload) {
  return updateUserPhone(payload.userId, payload.phone);
}

/** Registra o reconoce a un cliente presencial por su teléfono (llave de identidad). */
export function registerWalkInClient(payload: WalkInRegisterPayload) {
  return registerWalkInUser(payload);
}
