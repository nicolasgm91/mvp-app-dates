"use client";

/**
 * Hook del panel administrativo: agenda centralizada del día y alta rápida de
 * turnos presenciales. Evidencia useState + useEffect para la recarga de la
 * agenda al cambiar la fecha y tras cada alta.
 */
import { useCallback, useEffect, useState } from "react";
import type { AppointmentResponse } from "@/shared/contracts/appointment.contract";
import { BOOKING_CHANNELS } from "@/shared/constants/appointment-states";
import { registerWalkInClientRequest } from "./admin.api";
import {
  cancelAppointmentRequest,
  createAppointmentRequest,
  listAppointmentsByDateRequest,
} from "@/client/shared/api/appointments.api";
import {
  listServicesRequest,
  type ServiceDto,
} from "@/client/shared/api/services.api";
import { MS_PER_MINUTE } from "@/shared/constants/time";

/** Cancela una cita por su id (reutiliza la llamada compartida de citas). */
async function cancelAppointmentById(appointmentId: string) {
  return cancelAppointmentRequest(appointmentId);
}

/** Fecha de hoy en formato local YYYY-MM-DD (la jornada del salón). */
function todayIso(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export function useAdmin() {
  // El estado inicia vacío: "hoy" se calcula al montar (el prerender de Next.js
  // no permite evaluar la fecha actual en el primer render del servidor).
  const [date, setDate] = useState("");
  /** Límite inferior del calendario de la agenda: hoy (fijado al montar). */
  const [minDate, setMinDate] = useState("");
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /** Carga (o recarga) la agenda del día y el catálogo. */
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [agenda, catalog] = await Promise.all([
        listAppointmentsByDateRequest(date),
        listServicesRequest(),
      ]);
      setAppointments(agenda.data);
      setServices(catalog.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando la agenda del salón.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  // useEffect: la agenda depende de la fecha; sin fecha (primer render) no consulta.
  useEffect(() => {
    if (!date) {
      const today = todayIso();
      setDate(today);
      setMinDate(today);
      return;
    }
    void refresh();
  }, [refresh, date]);

  /**
   * Registra un turno presencial, con soporte de VARIOS servicios:
   * 1. upsert del cliente presencial (teléfono obligatorio: es el canal
   *    principal de comunicación; correo opcional, sintetizado del nombre
   *    si el cliente no lo entrega).
   * 2. crea las citas con canal IN_PERSON en franjas CONSECUTIVAS desde la
   *    hora indicada. Si una franja intermedia se ocupa, se cancelan las ya
   *    creadas (compensación) para no dejar la agenda a medias.
   */
  async function registerInPersonAppointment(
    input: { fullName: string; email?: string; phone: string; serviceIds: string[]; time: string },
  ) {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { data: walkInUser } = await registerWalkInClientRequest({
        fullName: input.fullName,
        phone: input.phone.trim(),
        email: input.email?.trim() || undefined,
      });

      const startTime = new Date(`${date}T${input.time}`);
      if (Number.isNaN(startTime.getTime())) {
        throw new Error("Selecciona una hora válida para el turno.");
      }

      // Resuelve todos los servicios ANTES de crear la primera cita: si uno
      // no existe, no se crea nada.
      const chosenServices = input.serviceIds
        .map((serviceId) => services.find((item) => item.id === serviceId))
        .filter((service): service is NonNullable<typeof service> => Boolean(service));
      if (chosenServices.length !== input.serviceIds.length) {
        throw new Error("Selecciona servicios válidos del catálogo.");
      }

      const createdIds: string[] = [];
      let cursor = startTime;
      try {
        for (const service of chosenServices) {
          const { data: appointment } = await createAppointmentRequest({
            userId: walkInUser.id,
            serviceId: service.id,
            startTime: cursor.toISOString(),
            channel: BOOKING_CHANNELS.IN_PERSON,
            locationConfirmed: false,
          });
          createdIds.push(appointment.id);
          cursor = new Date(cursor.getTime() + service.durationMinutes * MS_PER_MINUTE);
        }
      } catch (bookingError) {
        // Compensación: liberar las citas ya creadas del turno incompleto.
        for (const createdId of createdIds) {
          await cancelAppointmentById(createdId).catch(() => {
            // El error original es el que importa para el personal.
          });
        }
        throw bookingError;
      }

      setSuccessMessage(
        `Turno presencial registrado para ${input.fullName}: ${chosenServices
          .map((service) => service.name)
          .join(" + ")}.`,
      );
      await refresh();
      return createdIds;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar el turno.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  return {
    date,
    minDate,
    setDate,
    appointments,
    services,
    loading,
    submitting,
    error,
    successMessage,
    registerInPersonAppointment,
    clearMessages: () => {
      setError(null);
      setSuccessMessage(null);
    },
  };
}
