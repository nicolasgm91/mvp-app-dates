"use client";

/**
 * Vista declarativa del panel administrativo (/admin).
 * Una única agenda centralizada: muestra las reservas del día diferenciando el
 * canal (WEB vs presencial) y permite registrar turnos presenciales en pocos
 * pasos, sin fricción para el personal del salón.
 */
import Link from "next/link";
import { ShieldAlert, Store } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/client/core/context/AuthContext";
import { AlertBanner } from "@/client/shared/components/AlertBanner";
import { BookingCalendar } from "@/client/shared/components/BookingCalendar";
import { buildSlotsFor, DEFAULT_PREVIEW_DURATION, type Slot } from "@/client/shared/utils/slots";
import { APPOINTMENT_STATE_LABELS, BOOKING_CHANNEL_LABELS, SALON_LOCATION } from "@/shared/constants/appointment-states";
import { useAdmin } from "./useAdmin";

export function AdminPageView() {
  const { user, isAdmin, isHydrating } = useAuth();
  const admin = useAdmin();

  if (isHydrating) {
    return <p className="py-16 text-center text-gray-500">Cargando sesión…</p>;
  }

  // Guarda de rol: la agenda del salón es exclusiva del administrador.
  if (!user || !isAdmin) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-rose-500" aria-hidden />
        <h1 className="mt-3 text-xl font-semibold text-violet-900">
          Acceso solo para el administrador
        </h1>
        <p className="mt-1 text-gray-600">
          Ingresa con la cuenta de administrador del salón para ver la agenda centralizada.
        </p>
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
        <h1 className="text-2xl font-semibold text-violet-900">Agenda del salón</h1>
        <p className="text-sm text-gray-600">
          {SALON_LOCATION.openingHours}. Registra aquí los turnos presenciales para
          mantener la disponibilidad real sincronizada con el canal web.
        </p>
      </header>

      {admin.error && (
        <AlertBanner kind="error" message={admin.error} onClose={admin.clearMessages} />
      )}
      {admin.successMessage && (
        <AlertBanner
          kind="success"
          message={admin.successMessage}
          onClose={admin.clearMessages}
        />
      )}

      {/* Fila superior: calendario de la agenda a la izquierda y registro de
          turno presencial a la derecha. La tabla ocupa todo el ancho debajo. */}
      <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="agenda-heading" className="flex flex-col gap-3">
          <h2 id="agenda-heading" className="text-lg font-semibold text-gray-900">
            Reservas del día
          </h2>
          {/* Calendario visual de la agenda: sin tipear fechas ni días pasados */}
          <BookingCalendar
            value={admin.date}
            minDate={admin.minDate}
            onChange={admin.setDate}
          />
        </section>

        {/* Alta rápida de turno presencial, al lado del calendario */}
        <section aria-labelledby="inperson-heading" className="flex flex-col gap-3">
          <h2 id="inperson-heading" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Store className="h-5 w-5 text-violet-600" aria-hidden />
            Registrar turno presencial
          </h2>
          <InPersonForm
            services={admin.services}
            appointments={admin.appointments}
            date={admin.date}
            submitting={admin.submitting}
            onSubmit={admin.registerInPersonAppointment}
          />
        </section>
      </div>

      {/* Agenda del día: tabla con todas las reservas de la fecha elegida */}
      <section aria-label="Tabla de reservas del día" className="flex flex-col gap-3">
        {admin.loading ? (
          <p className="text-sm text-gray-500">Cargando agenda…</p>
        ) : admin.appointments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-8 text-center text-sm text-gray-600">
            No hay reservas para esta fecha.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-violet-50/60 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-2">Hora</th>
                  <th className="px-4 py-2">Servicio</th>
                  <th className="px-4 py-2">Cliente</th>
                  <th className="px-4 py-2">Canal</th>
                  <th className="px-4 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {admin.appointments.map((appointment) => {
                  // Las canceladas NO ocupan agenda: se muestran atenuadas y
                  // tachadas para que la fila activa se lea de un vistazo.
                  const isCancelled = appointment.status === "CANCELLED";
                  return (
                    <tr
                      key={appointment.id}
                      className={`border-b border-gray-100 last:border-0 ${
                        isCancelled ? "bg-gray-50 text-gray-400 line-through decoration-gray-300" : ""
                      }`}
                    >
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {new Date(appointment.startTime).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </td>
                      <td className="px-4 py-2">{appointment.service.name}</td>
                      <td className="px-4 py-2">
                        <span className="block">{appointment.user.fullName}</span>
                        <span className="block text-xs text-gray-500">
                          {appointment.user.phone ?? "Sin teléfono"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            appointment.channel === "WEB"
                              ? "bg-violet-100 text-violet-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {BOOKING_CHANNEL_LABELS[appointment.channel]}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            isCancelled
                              ? "bg-gray-200 text-gray-500"
                              : appointment.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-violet-100 text-violet-800"
                          }`}
                        >
                          {APPOINTMENT_STATE_LABELS[appointment.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

type InPersonFormProps = {
  services: { id: string; name: string; durationMinutes: number }[];
  /** Reservas de la fecha seleccionada, para calcular las franjas disponibles. */
  appointments: { startTime: string; endTime: string; status: string }[];
  /** Fecha de la agenda (YYYY-MM-DD) sobre la que se construyen las franjas. */
  date: string;
  submitting: boolean;
  onSubmit: (input: { fullName: string; email?: string; phone: string; serviceIds: string[]; time: string }) => Promise<unknown>;
};

/** Formulario corto: nombre, teléfono, franja y hora obligatorios; correo
 * opcional; servicios multi-selección con chips. Las franjas se eligen igual
 * que en la reserva del cliente: chips con ocupadas tachadas y tolerancia
 * para registrar al cliente que acaba de llegar. */
function InPersonForm({ services, appointments, date, submitting, onSubmit }: InPersonFormProps) {
  // useState locales del formulario presencial (controlled inputs).
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  /** Agrega o quita un servicio del turno presencial (multi-selección). */
  function toggleService(serviceId: string) {
    setServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
    // Cambiar el carrito cambia la duración total y las franjas viables.
    setTime("");
  }

  // Grilla de franjas: la duración es la del combo seleccionado (o una de
  // previsualización); se permite la franja en curso para el cliente que
  // llega ahora mismo (misma tolerancia del servidor: 5 minutos).
  const slots = useMemo(() => {
    const totalDuration = services
      .filter((service) => serviceIds.includes(service.id))
      .reduce((total, service) => total + service.durationMinutes, 0);
    return buildSlotsFor(date, appointments, totalDuration || DEFAULT_PREVIEW_DURATION, {
      // Canal presencial: el personal puede agendar en cualquier momento del
      // día (en el ajetreo se pierde la noción del tiempo; el backend tampoco
      // restringe horas atrasadas para turnos IN_PERSON).
      allowPast: true,
    });
  }, [services, serviceIds, date, appointments]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Validación mínima en cliente; el backend vuelve a validar todo.
    // El teléfono es obligatorio: es el canal principal de comunicación.
    if (!fullName.trim() || !phone.trim() || !time || serviceIds.length === 0) {
      setValidationError(
        "Completa nombre, teléfono y franja, y selecciona al menos un servicio.",
      );
      return;
    }
    setValidationError(null);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        serviceIds,
        time,
      });
      setFullName("");
      setEmail("");
      setPhone("");
      setServiceIds([]);
      setTime("");
    } catch {
      // El error ya se muestra en el AlertBanner del panel.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">Nombre del cliente</span>
        <input
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Ej. María Torres"
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">Teléfono</span>
        <input
          type="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="300 000 0000"
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">
          Correo <span className="font-normal text-gray-400">(opcional)</span>
        </span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Si el cliente lo entrega"
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {submitting ? "Registrando…" : "Registrar turno"}
      </button>
      <div className="sm:col-span-2 lg:col-span-5">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          Servicios
          {serviceIds.length > 0 && (
            <span className="ml-2 text-xs font-normal text-violet-700">
              {serviceIds.length} seleccionado{serviceIds.length > 1 ? "s" : ""} (franjas consecutivas)
            </span>
          )}
        </span>
        <div className="flex flex-wrap gap-2">
          {services.map((service) => {
            const selected = serviceIds.includes(service.id);
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleService(service.id)}
                aria-pressed={selected}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selected
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-violet-400 hover:bg-violet-50"
                }`}
              >
                {service.name} · {service.durationMinutes} min
              </button>
            );
          })}
        </div>
      </div>
      <div className="sm:col-span-2 lg:col-span-5">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          Franja horaria
          {time && <span className="ml-2 text-xs font-normal text-violet-700">desde las {time}</span>}
        </span>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {slots.map((slot: Slot) => (
            <button
              key={slot.label}
              type="button"
              disabled={!slot.available}
              onClick={() => setTime(slot.label)}
              className={`rounded-xl border px-2 py-1.5 text-xs font-medium transition ${
                !slot.available
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through"
                  : slot.label === time
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-violet-200 bg-white text-violet-800 hover:bg-violet-600 hover:text-white"
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>
      {validationError && (
        <p className="text-sm text-rose-700 sm:col-span-2 lg:col-span-5">{validationError}</p>
      )}
    </form>
  );
}
