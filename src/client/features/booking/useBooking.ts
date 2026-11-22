"use client";

/**
 * Hook de lógica de la vista de reserva.
 * Evidencia los hooks de la SPEC:
 * - useState: servicios seleccionados (carrito), fecha, franja y estados de envío.
 * - useEffect: carga del catálogo al montar, agenda al cambiar la fecha y
 *   sincronización al volver a la pestaña.
 *
 * Flujo con carrito (hora pico): la clienta puede combinar VARIOS servicios;
 * el sistema calcula la duración total y, con UNA sola confirmación, crea las
 * reservas en franjas CONSECUTIVAS, sin dejar hueco para que otro cliente robe
 * la franja entre servicio y servicio. Si una franja del combo se ocupa a mitad
 * de camino, se deshacen las reservas ya creadas (compensación) y se informa.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cancelAppointmentRequest,
  createAppointmentRequest,
  listAppointmentsByDateRequest,
} from "@/client/shared/api/appointments.api";
import {
  listServicesRequest,
  type ServiceDto,
} from "@/client/shared/api/services.api";
import type { CreateAppointmentPayload } from "@/shared/contracts/appointment.contract";
import { useAuth } from "@/client/core/context/AuthContext";
import { MS_PER_MINUTE } from "@/shared/constants/time";
import {
  DEFAULT_PREVIEW_DURATION,
  buildSlotsFor,
  type Slot,
} from "@/client/shared/utils/slots";

/** Fecha de hoy en formato local YYYY-MM-DD. */
function todayIsoLocal(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export type { Slot };

export function useBooking() {
  const { user } = useAuth();

  // --- useState: todo el estado interactivo de la vista de reserva ---
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  /** Carrito de servicios: ids de todos los servicios que la clienta quiere. */
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  // La fecha y el mínimo del selector inician vacíos; "hoy" se calcula al montar
  // (el prerender de Next.js no permite evaluar la fecha actual en el servidor).
  const [date, setDate] = useState("");
  const [minDate, setMinDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedServices = useMemo(
    () => services.filter((service) => selectedServiceIds.includes(service.id)),
    [services, selectedServiceIds],
  );

  /** Duración total del combo (suma de las duraciones de los servicios elegidos). */
  const totalDurationMinutes = useMemo(
    () => selectedServices.reduce((total, service) => total + service.durationMinutes, 0),
    [selectedServices],
  );

  /** Valor total del combo (suma de los precios de los servicios elegidos). */
  const totalPrice = useMemo(
    () => selectedServices.reduce((total, service) => total + service.price, 0),
    [selectedServices],
  );

  // --- useEffect 1: carga del catálogo de servicios (una sola vez) ---
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await listServicesRequest();
        if (!cancelled) setServices(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error cargando el catálogo.");
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- useEffect 2: recarga la agenda al cambiar la fecha o la duración total ---
  // La recarga vive en refreshSlots para poder invocarla también al volver a
  // la pestaña: la agenda es compartida y cambia mientras el usuario mira otra
  // vista (o mientras el salón registra turnos presenciales).
  const refreshSlots = useCallback(async () => {
    if (!date) return;
    setSlotsLoading(true);
    try {
      const { data } = await listAppointmentsByDateRequest(date);
      const previewDuration = totalDurationMinutes || DEFAULT_PREVIEW_DURATION;
      setSlots(buildSlotsFor(date, data, previewDuration));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando la agenda.");
    } finally {
      setSlotsLoading(false);
    }
  }, [date, totalDurationMinutes]);

  useEffect(() => {
    if (!date) {
      const today = todayIsoLocal();
      setDate(today);
      setMinDate(today);
      return;
    }
    void refreshSlots();
  }, [date, refreshSlots]);

  // useEffect 3: sincroniza la grilla al volver a la pestaña (visibilidad).
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshSlots();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [refreshSlots]);

  /** Agrega o quita un servicio del carrito. */
  const toggleService = useCallback((serviceId: string) => {
    setError(null);
    setSuccessMessage(null);
    setSelectedSlot(null);
    setSelectedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  }, []);

  /** Marca una franja como seleccionada y abre el modal de confirmación. */
  const chooseSlot = useCallback((slot: Slot) => {
    if (selectedServiceIds.length === 0) {
      setError("Primero elige al menos un servicio para habilitar las franjas horarias.");
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setSelectedSlot(slot);
    setLocationModalOpen(true);
  }, [selectedServiceIds.length]);

  /**
   * Confirma el combo completo del carrito en franjas consecutivas.
   * Ejemplo: manicure (45) + pedicure (60) elegidos para las 10:00 crean dos
   * reservas: 10:00-10:45 y 10:45-11:45, en una sola acción del usuario.
   *
   * Manejo de errores con compensación: si una franja intermedia se ocupa
   * (409 en carrera con otro cliente), se cancelan las reservas ya creadas
   * del combo para no dejar un pedido incompleto en la agenda.
   */
  const confirmBooking = useCallback(
    async (locationConfirmed: boolean) => {
      if (!user || !selectedSlot) {
        setError("Selecciona una franja horaria antes de confirmar.");
        return;
      }
      if (selectedServices.length === 0) {
        setError("Selecciona al menos un servicio antes de confirmar.");
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const createdIds: string[] = [];
        let cursor = selectedSlot.start;

        for (const service of selectedServices) {
          const payload: CreateAppointmentPayload = {
            userId: user.id,
            serviceId: service.id,
            startTime: cursor.toISOString(),
            channel: "WEB",
            locationConfirmed,
          };
          try {
            const { data } = await createAppointmentRequest(payload);
            createdIds.push(data.id);
          } catch (err) {
            // Carrera perdida: otro cliente tomó una franja del combo.
            // Compensación: cancelar lo ya creado para no dejar la agenda a medias.
            for (const createdId of createdIds) {
              await cancelAppointmentRequest(createdId).catch(() => {
                // Si la compensación falla, el error original es el que importa.
              });
            }
            const message = err instanceof Error ? err.message : "No fue posible crear la reserva.";
            throw new Error(
              `No se pudo completar el combo completo: ${message} Tus reservas de este intento fueron liberadas.`,
            );
          }
          cursor = new Date(cursor.getTime() + service.durationMinutes * 60_000);
        }

        setSuccessMessage(
          `Reserva confirmada: ${selectedServices
            .map((service) => service.name)
            .join(" + ")} el ${date} desde las ${selectedSlot.label}.`,
        );
        setSelectedSlot(null);
        setLocationModalOpen(false);
        // Vacía el carrito: el combo quedó reservado.
        setSelectedServiceIds([]);
        // Refresca la agenda para mostrar los bloques recién ocupados.
        await refreshSlots();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No fue posible crear la reserva.");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [user, selectedSlot, selectedServices, date, refreshSlots],
  );

  return {
    services,
    servicesLoading,
    selectedServices,
    selectedServiceIds,
    totalDurationMinutes,
    totalPrice,
    toggleService,
    date,
    minDate,
    setDate: (value: string) => {
      setDate(value);
      setSelectedSlot(null);
      setSuccessMessage(null);
    },
    slots,
    slotsLoading,
    selectedSlot,
    chooseSlot,
    locationModalOpen,
    closeLocationModal: () => setLocationModalOpen(false),
    confirmBooking,
    submitting,
    error,
    successMessage,
    clearMessages: () => {
      setError(null);
      setSuccessMessage(null);
    },
  };
}
