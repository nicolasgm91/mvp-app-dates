"use client";

/**
 * Calendario de reserva: selección visual del día, sin tipear fechas.
 * - Solo se pueden elegir días de HOY en adelante (los pasados aparecen
 *   deshabilitados: los clientes no se equivocan y no hay reservas atrasadas).
 * - Semana de lunes a domingo (convención colombiana).
 * - Navegación por meses con flechas; el botón "anterior" se deshabilita
 *   cuando el mes completo ya pasó.
 * Componente presentacional: la lógica de disponibilidad vive en useBooking.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type BookingCalendarProps = {
  /** Fecha seleccionada en formato YYYY-MM-DD. */
  value: string;
  /** Fecha mínima seleccionable (hoy), en formato YYYY-MM-DD. */
  minDate: string;
  onChange: (dateIso: string) => void;
};

/** Nombres de día (lunes primero) y de mes en español. */
const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });
}

/** YYYY-MM-DD local a partir de año, mes (0-11) y día. */
function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function BookingCalendar({ value, minDate, onChange }: BookingCalendarProps) {
  // Estado de navegación: mes que se está viendo (inicia en el mes actual).
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  // Al cambiar la fecha seleccionada, sincroniza el mes visible con ella.
  useEffect(() => {
    if (!value) return;
    const selected = new Date(`${value}T12:00:00`);
    setViewYear(selected.getFullYear());
    setViewMonth(selected.getMonth());
  }, [value]);

  const todayIso = minDate;
  const minMonthIso = minDate ? `${minDate.slice(0, 7)}-01` : "";

  /** ¿Se puede navegar al mes anterior? (no si todo el mes ya pasó) */
  const canGoPrev = () => {
    if (!minMonthIso) return false;
    const prevMonthIso = toIso(viewYear, viewMonth, 1);
    const prevKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    const minKey = minMonthIso.slice(0, 7);
    if (prevKey >= minKey) return true;
    return prevMonthIso > minMonthIso;
  };

  function goPrev() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((year) => year - 1);
    } else {
      setViewMonth((month) => month - 1);
    }
  }

  function goNext() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((year) => year + 1);
    } else {
      setViewMonth((month) => month + 1);
    }
  }

  // Celdas del mes: desfase del primer día (lunes=0) + días reales.
  const firstWeekdayOffset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekdayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => toIso(viewYear, viewMonth, index + 1)),
  ];

  return (
    <div className="w-fit max-w-full rounded-2xl border border-violet-100 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev()}
          aria-label="Mes anterior"
          className="rounded-full p-1.5 text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <p className="text-sm font-semibold text-violet-900 first-letter:uppercase">
          {monthLabel(viewYear, viewMonth)}
        </p>
        <button
          type="button"
          onClick={goNext}
          aria-label="Mes siguiente"
          className="rounded-full p-1.5 text-violet-700 hover:bg-violet-100"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="w-8 text-xs font-medium text-gray-400">
            {label}
          </span>
        ))}
        {cells.map((dayIso, index) =>
          dayIso === null ? (
            <span key={`empty-${index}`} className="w-8" />
          ) : (
            <button
              key={dayIso}
              type="button"
              disabled={dayIso < todayIso}
              onClick={() => onChange(dayIso)}
              aria-pressed={dayIso === value}
              className={`h-8 w-8 justify-self-center rounded-full text-sm transition ${
                dayIso === value
                  ? "bg-violet-600 font-semibold text-white"
                  : dayIso < todayIso
                    ? "cursor-not-allowed text-gray-300"
                    : "text-gray-800 hover:bg-violet-100"
              }`}
            >
              {Number(dayIso.slice(8))}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
