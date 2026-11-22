/**
 * Controlador de reservas.
 * Traduce HTTP ↔ dominio: valida contratos, normaliza query params y arma respuestas.
 */
import { NextResponse } from "next/server";
import { createAppointmentSchema } from "@/shared/contracts/appointment.contract";
import { bookAppointment, getAppointments } from "./appointment.service";

/** Maneja GET /api/appointments con filtros opcionales ?userId= y ?date=YYYY-MM-DD. */
export async function handleListAppointments(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? undefined;
  const date = url.searchParams.get("date") ?? undefined;

  const appointments = await getAppointments({ userId, date });
  return NextResponse.json(appointments, { status: 200 });
}

/**
 * Maneja POST /api/appointments.
 * El contrato Zod ya exige locationConfirmed = true cuando el canal es WEB;
 * el cruce de horarios lo valida la capa de servicio (409).
 */
export async function handleCreateAppointment(request: Request) {
  const body = await request.json();
  const payload = createAppointmentSchema.parse(body);
  const appointment = await bookAppointment(payload);
  return NextResponse.json(appointment, { status: 201 });
}
