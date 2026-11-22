"use client";

/**
 * Hook de lógica del flujo de inicio de sesión federado (simulado en el MVP).
 * Flujo en dos pasos naturales:
 * 1. El usuario elige su proveedor federado; el backend hace upsert.
 * 2. Si la cuenta es nueva y no tiene teléfono, se pide el celular ANTES de
 *    entrar a la app (regla de negocio: el teléfono es el principal canal de
 *    comunicación del salón y se captura desde el primer contacto).
 * Al terminar, el usuario se desplaza a su lugar natural:
 * clientes -> /booking, administrador -> /admin.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  federatedLoginSchema,
  updatePhoneSchema,
} from "@/shared/contracts/auth.contract";
import type { AuthUser } from "@/client/core/context/AuthContext";
import type { FederatedLoginPayload } from "@/shared/contracts/auth.contract";
import { useAuth } from "@/client/core/context/AuthContext";
import { federatedLoginRequest, updatePhoneRequest } from "./auth.api";

/** Proveedores federados soportados por la demo. */
export type DemoProvider = "GOOGLE" | "FACEBOOK" | "APPLE";

/** Payloads de demostración: simulan la respuesta del proveedor de identidad. */
const GOOGLE_DEMO_PAYLOAD: FederatedLoginPayload = {
  email: "laura.martinez@gmail.com",
  fullName: "Laura Martínez",
  authProvider: "GOOGLE",
  providerAccountId: "demo-client-account",
  phone: "3001234567",
};

const FACEBOOK_DEMO_PAYLOAD: FederatedLoginPayload = {
  email: "carla.gomez@gmail.com",
  fullName: "Carla Gómez",
  authProvider: "FACEBOOK",
  providerAccountId: "demo-facebook-account",
};

const APPLE_DEMO_PAYLOAD: FederatedLoginPayload = {
  email: "sandra.perez@gmail.com",
  fullName: "Sandra Pérez",
  authProvider: "APPLE",
  providerAccountId: "demo-apple-account",
};

const ADMIN_DEMO_PAYLOAD: FederatedLoginPayload = {
  email: "admin@centroesteticovioleta.com",
  fullName: "Administrador Violeta",
  authProvider: "GOOGLE",
  providerAccountId: "demo-admin-account",
};

const PROVIDER_PAYLOADS: Record<DemoProvider, FederatedLoginPayload> = {
  GOOGLE: GOOGLE_DEMO_PAYLOAD,
  FACEBOOK: FACEBOOK_DEMO_PAYLOAD,
  APPLE: APPLE_DEMO_PAYLOAD,
};

/** Pasos del flujo de login: elección de proveedor y contacto inicial. */
export type LoginStep = "providers" | "phone";

export function useLogin() {
  const { login, updateSessionPhone } = useAuth();
  const router = useRouter();
  // useState: paso actual, cargas, error y usuario pendiente de completar contacto.
  const [step, setStep] = useState<LoginStep>("providers");
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [redirectTo, setRedirectTo] = useState("/booking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Inicia sesión con un proveedor federado. */
  async function signInWithProvider(provider: DemoProvider) {
    setError(null);
    setLoading(true);
    try {
      const payload = federatedLoginSchema.parse(PROVIDER_PAYLOADS[provider]);
      const user = await login(payload);
      afterAuthentication(user, "/booking");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  /** Acceso de demostración del administrador del salón. */
  async function signInAsAdmin() {
    setError(null);
    setLoading(true);
    try {
      const payload = federatedLoginSchema.parse(ADMIN_DEMO_PAYLOAD);
      const user = await login(payload);
      afterAuthentication(user, "/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Decide el paso siguiente tras autenticar: si es un contacto nuevo sin
   * teléfono (cliente), pide el celular; si ya lo tiene, desplaza a la app.
   * El administrador del salón no pasa por la captura de contacto.
   */
  function afterAuthentication(user: AuthUser, redirect: string) {
    setRedirectTo(redirect);
    if (user.role === "CLIENT" && !user.phone) {
      setPendingUser(user);
      setStep("phone");
      return;
    }
    router.push(redirect);
  }

  /** Guarda el celular del primer contacto y desplaza al usuario a la app. */
  async function submitPhone(phone: string) {
    if (!pendingUser) return;
    setError(null);
    setLoading(true);
    try {
      // El MISMO contrato Zod valida en cliente y servidor.
      const payload = updatePhoneSchema.parse({ userId: pendingUser.id, phone });
      const { data: updated } = await updatePhoneRequest(payload);
      updateSessionPhone(updated.phone ?? phone);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar el teléfono.");
    } finally {
      setLoading(false);
    }
  }

  /** Vuelve al paso de proveedores (cancela la captura de contacto). */
  function backToProviders() {
    setStep("providers");
    setPendingUser(null);
    setError(null);
  }

  return {
    step,
    pendingUser,
    signInWithProvider,
    signInAsAdmin,
    submitPhone,
    backToProviders,
    loading,
    error,
  };
}
