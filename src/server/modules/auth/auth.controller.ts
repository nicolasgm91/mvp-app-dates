/**
 * Controlador de autenticación federada.
 * Traduce HTTP ↔ dominio: valida el contrato de entrada y forma la respuesta.
 */
import { NextResponse } from "next/server";
import {
  federatedLoginSchema,
  updatePhoneSchema,
  walkInRegisterSchema,
} from "@/shared/contracts/auth.contract";
import {
  federatedLogin,
  registerWalkInClient,
  saveUserPhone,
} from "./auth.service";

/** Maneja POST /api/auth/federated con el payload del proveedor de identidad. */
export async function handleFederatedLogin(request: Request) {
  const body = await request.json();
  const payload = federatedLoginSchema.parse(body);
  const user = await federatedLogin(payload);
  return NextResponse.json(user, { status: 200 });
}

/** Maneja PATCH /api/auth/phone para guardar el teléfono del primer contacto. */
export async function handleUpdatePhone(request: Request) {
  const body = await request.json();
  const payload = updatePhoneSchema.parse(body);
  const user = await saveUserPhone(payload);
  return NextResponse.json(user, { status: 200 });
}

/**
 * Maneja POST /api/auth/walk-in: registra (o reconoce por teléfono) al cliente
 * presencial y devuelve la cuenta para crear su turno.
 */
export async function handleWalkInRegister(request: Request) {
  const body = await request.json();
  const payload = walkInRegisterSchema.parse(body);
  const user = await registerWalkInClient(payload);
  return NextResponse.json(user, { status: 200 });
}
