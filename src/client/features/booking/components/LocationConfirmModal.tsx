"use client";

/**
 * Modal de confirmación de reserva.
 * Estructura sin redundancia: (1) resumen de lo que se reserva (fecha, hora,
 * servicios y duración total), (2) la dirección física como dato de apoyo
 * (aparece UNA sola vez), (3) aceptación explícita de que la cita es presencial.
 * Requisito de negocio de la Actividad 2: la reserva web exige que el cliente
 * haya visto y aceptado la dirección antes de confirmar.
 */
import { CalendarDays, Clock, MapPin, Tag } from "lucide-react";
import { SALON_LOCATION } from "@/shared/constants/appointment-states";
import { formatCop } from "@/client/shared/utils/format";

type LocationConfirmModalProps = {
  open: boolean;
  /** Fecha seleccionada en formato YYYY-MM-DD (la muestra formateada). */
  date: string | null;
  slotLabel: string | null;
  /** Resumen del combo: nombres de servicios y duración total. */
  servicesSummary: string | null;
  /** Valor total del combo en COP. */
  totalPrice: number | null;
  submitting: boolean;
  onConfirm: (locationConfirmed: boolean) => void;
  onClose: () => void;
};

export function LocationConfirmModal({
  open,
  date,
  slotLabel,
  servicesSummary,
  totalPrice,
  submitting,
  onConfirm,
  onClose,
}: LocationConfirmModalProps) {
  if (!open) return null;

  const dateLabel = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="location-modal-title" className="text-lg font-semibold text-gray-900">
          Confirma tu reserva
        </h2>

        {/* 1. Resumen de la reserva (una sola vez, estructurado) */}
        <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-900">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
            {dateLabel} · {slotLabel}
          </p>
          <p className="mt-2 flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{servicesSummary}</span>
          </p>
          {totalPrice !== null && (
            <p className="mt-2 flex items-center gap-2 font-semibold">
              <Tag className="h-4 w-4 shrink-0" aria-hidden />
              Total: {formatCop(totalPrice)}
            </p>
          )}
        </div>

        {/* 2. Dirección física: dato de apoyo, aparece una sola vez */}
        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden />
            <span>
              <strong className="text-gray-900">{SALON_LOCATION.name}</strong> ·{" "}
              {SALON_LOCATION.fullAddress}
              <br />
              {SALON_LOCATION.openingHours}
            </span>
          </p>
        </div>

        {/* La dirección queda a la vista y el clic en Confirmar ES la
            aceptación explícita del cliente (locationConfirmed = true). */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => onConfirm(true)}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {submitting ? "Confirmando…" : "Confirmar reserva"}
          </button>
        </div>
      </div>
    </div>
  );
}
