"use client";

/**
 * Vista declarativa del historial de reservas del cliente (/my-appointments).
 * Lista las reservas activas y pasadas, distingue su estado y permite
 * cancelar las confirmadas (la franja se libera al instante).
 */
import Link from "next/link";
import { CalendarX2, LogIn } from "lucide-react";
import { useAuth } from "@/client/core/context/AuthContext";
import { AlertBanner } from "@/client/shared/components/AlertBanner";
import { APPOINTMENT_STATE_LABELS, BOOKING_CHANNEL_LABELS } from "@/shared/constants/appointment-states";
import { useMyAppointments } from "./useMyAppointments";

export function MyAppointmentsPageView() {
  const { user, isHydrating } = useAuth();
  const list = useMyAppointments();

  if (isHydrating) {
    return <p className="py-16 text-center text-gray-500">Cargando sesión…</p>;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <LogIn className="mx-auto h-8 w-8 text-violet-600" aria-hidden />
        <h1 className="mt-3 text-xl font-semibold text-violet-900">
          Inicia sesión para ver tus reservas
        </h1>
        <Link
          href="/"
          className="mt-5 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Ir al inicio de sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-violet-900">Mis reservas</h1>
        <p className="text-sm text-gray-600">
          Historial de citas de {user.fullName}. Al cancelar, tu franja vuelve a
          estar disponible de inmediato.
        </p>
      </header>

      {list.error && (
        <AlertBanner kind="error" message={list.error} onClose={list.clearMessages} />
      )}
      {list.successMessage && (
        <AlertBanner
          kind="success"
          message={list.successMessage}
          onClose={list.clearMessages}
        />
      )}

      {list.loading ? (
        <p className="text-sm text-gray-500">Cargando reservas…</p>
      ) : list.appointments.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center">
          <CalendarX2 className="mx-auto h-8 w-8 text-violet-300" aria-hidden />
          <p className="mt-3 font-medium text-gray-800">Aún no tienes reservas</p>
          <Link
            href="/booking"
            className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Reservar mi primera cita
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.appointments.map((appointment) => {
            const isConfirmed = appointment.status === "CONFIRMED";
            return (
              <li
                key={appointment.id}
                className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-gray-900">{appointment.service.name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(appointment.startTime).toLocaleDateString("es-CO", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    ·{" "}
                    {new Date(appointment.startTime).toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                    {" – "}
                    {new Date(appointment.endTime).toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </p>
                  <p className="flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        isConfirmed
                          ? "bg-emerald-100 text-emerald-800"
                          : appointment.status === "CANCELLED"
                            ? "bg-gray-200 text-gray-600"
                            : "bg-violet-100 text-violet-800"
                      }`}
                    >
                      {APPOINTMENT_STATE_LABELS[appointment.status]}
                    </span>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-800">
                      Canal: {BOOKING_CHANNEL_LABELS[appointment.channel]}
                    </span>
                  </p>
                </div>
                {isConfirmed && (
                  <button
                    type="button"
                    disabled={list.cancellingId === appointment.id}
                    onClick={() => void list.cancelAppointment(appointment.id)}
                    className="self-start rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60 sm:self-auto"
                  >
                    {list.cancellingId === appointment.id ? "Cancelando…" : "Cancelar reserva"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
