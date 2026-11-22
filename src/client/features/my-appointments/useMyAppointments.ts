"use client";

/**
 * Hook de consulta y cancelación de las reservas del usuario autenticado.
 * Evidencia useState (listado, cargas, cancelación en curso) y useEffect
 * (recarga al montar y al volver de una cancelación).
 */
import { useCallback, useEffect, useState } from "react";
import type { AppointmentResponse } from "@/shared/contracts/appointment.contract";
import { cancelAppointmentRequest, listUserAppointmentsRequest } from "@/client/shared/api/appointments.api";
import { useAuth } from "@/client/core/context/AuthContext";

export function useMyAppointments() {
  const { user, isHydrating } = useAuth();

  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /** Carga (o recarga) las reservas del usuario en sesión. */
  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await listUserAppointmentsRequest(user.id);
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando tus reservas.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // useEffect: el historial depende de la sesión (userId).
  useEffect(() => {
    if (!isHydrating) {
      void refresh();
    }
  }, [isHydrating, refresh]);

  /**
   * Cancela una reserva activa. Al terminar recarga el listado: la franja
   * liberada vuelve a aparecer disponible en /booking de inmediato.
   */
  const cancelAppointment = useCallback(async (appointmentId: string) => {
    setError(null);
    setSuccessMessage(null);
    setCancellingId(appointmentId);
    try {
      await cancelAppointmentRequest(appointmentId);
      setSuccessMessage("Reserva cancelada. La franja quedó disponible para otros clientes.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cancelar la reserva.");
    } finally {
      setCancellingId(null);
    }
  }, [refresh]);

  return {
    appointments,
    loading,
    error,
    cancellingId,
    successMessage,
    cancelAppointment,
    clearMessages: () => {
      setError(null);
      setSuccessMessage(null);
    },
  };
}
