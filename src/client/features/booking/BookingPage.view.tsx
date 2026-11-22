"use client";

/**
 * Vista declarativa de agendamiento (/booking).
 * Flujo: elegir servicios (carrito, se pueden combinar) -> elegir fecha ->
 * elegir franja (habilitada solo con servicios en el carrito) ->
 * confirmar dirección física en el modal -> combo reservado en franjas
 * consecutivas (201) o mensaje claro de conflicto (409).
 */
import Link from "next/link";
import { Clock, LogIn, ShoppingBasket } from "lucide-react";
import { useAuth } from "@/client/core/context/AuthContext";
import { AlertBanner } from "@/client/shared/components/AlertBanner";
import { formatCop } from "@/client/shared/utils/format";
import { BookingCalendar } from "@/client/shared/components/BookingCalendar";
import { ServiceCard } from "./components/ServiceCard";
import { LocationConfirmModal } from "./components/LocationConfirmModal";
import { useBooking } from "./useBooking";

export function BookingPageView() {
  const { user, isHydrating } = useAuth();
  const booking = useBooking();

  // Guarda de sesión simple: sin usuario, invitamos a iniciar sesión.
  if (isHydrating) {
    return <p className="py-16 text-center text-gray-500">Cargando sesión…</p>;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <LogIn className="mx-auto h-8 w-8 text-violet-600" aria-hidden />
        <h1 className="mt-3 text-xl font-semibold text-violet-900">
          Inicia sesión para reservar
        </h1>
        <p className="mt-1 text-gray-600">
          El autogestión de citas requiere un usuario autenticado.
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

  const hasCart = booking.selectedServiceIds.length > 0;
  const servicesSummary = hasCart
    ? `${booking.selectedServices.map((service) => service.name).join(" + ")} (${booking.totalDurationMinutes} min en total)`
    : null;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-violet-900">Reserva tu cita</h1>
        <p className="text-sm text-gray-600">
          Elige los servicios, la fecha y la franja horaria. La agenda se sincroniza con
          el salón en tiempo real.
        </p>
      </header>

      {booking.error && (
        <AlertBanner kind="error" message={booking.error} onClose={booking.clearMessages} />
      )}
      {booking.successMessage && (
        <AlertBanner
          kind="success"
          message={booking.successMessage}
          onClose={booking.clearMessages}
        />
      )}

      {/* Paso 1: catálogo de servicios (carrito con selección múltiple) */}
      <section aria-labelledby="services-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="services-heading" className="text-lg font-semibold text-gray-900">
            1. Elige tus servicios
          </h2>
          {hasCart && (
            <span className="flex items-center gap-2 rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white">
              <ShoppingBasket className="h-3.5 w-3.5" aria-hidden />
              {booking.selectedServices.length}{" "}
              {booking.selectedServices.length === 1 ? "servicio" : "servicios"} ·{" "}
              {booking.totalDurationMinutes} min · {formatCop(booking.totalPrice)}
            </span>
          )}
        </div>
        {booking.servicesLoading ? (
          <p className="text-sm text-gray-500">Cargando catálogo…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {booking.services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                selected={booking.selectedServiceIds.includes(service.id)}
                onToggle={booking.toggleService}
              />
            ))}
          </div>
        )}
      </section>

      {/* Paso 2: fecha y franjas disponibles */}
      <section aria-labelledby="slots-heading" className="flex flex-col gap-3">
        <h2 id="slots-heading" className="text-lg font-semibold text-gray-900">
          2. Elige la fecha y la franja
        </h2>
        {/* Escritorio: calendario a la izquierda y franjas pegadas a su
            derecha (sin hueco al medio). Móvil: calendario arriba, franjas
            debajo. */}
        <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
          <div className="md:justify-self-start">
            <BookingCalendar
              value={booking.date}
              minDate={booking.minDate}
              onChange={booking.setDate}
            />
          </div>
          <div className="flex flex-col gap-2">
            {booking.slotsLoading ? (
              <p className="text-sm text-gray-500">Consultando disponibilidad…</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {booking.slots.map((slot) => (
                  <button
                    key={slot.label}
                    type="button"
                    disabled={!slot.available || !hasCart}
                    onClick={() => booking.chooseSlot(slot)}
                    aria-disabled={!slot.available || !hasCart}
                    className={`rounded-xl border px-2 py-2 text-sm font-medium transition ${
                      !slot.available
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through"
                        : !hasCart
                          ? "cursor-not-allowed border-gray-200 bg-white text-gray-300"
                          : "border-violet-200 bg-white text-violet-800 hover:bg-violet-600 hover:text-white"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
            {!hasCart && (
              <p className="flex items-center gap-1 text-xs text-violet-700">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                Selecciona al menos un servicio para habilitar las franjas horarias.
              </p>
            )}
          </div>
        </div>
      </section>

      <LocationConfirmModal
        open={booking.locationModalOpen}
        date={booking.date}
        slotLabel={booking.selectedSlot?.label ?? null}
        servicesSummary={servicesSummary}
        totalPrice={booking.totalPrice}
        submitting={booking.submitting}
        onConfirm={booking.confirmBooking}
        onClose={booking.closeLocationModal}
      />
    </main>
  );
}
