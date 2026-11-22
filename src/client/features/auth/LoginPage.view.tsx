"use client";

/**
 * Vista declarativa de inicio de sesión.
 * Flujo: (1) proveedor federado -> (2) si es un contacto nuevo, captura del
 * celular (canal principal del salón) -> entrada directa a la aplicación.
 * Un usuario ya autenticado no ve esta vista: se le redirige a su lugar.
 */
import { CalendarHeart, Fingerprint, Globe, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/client/core/context/AuthContext";
import { useLogin } from "./useLogin";
import { AlertBanner } from "@/client/shared/components/AlertBanner";
import { SALON_LOCATION } from "@/shared/constants/appointment-states";

export function LoginPageView() {
  const { user, isAdmin, isHydrating } = useAuth();
  const router = useRouter();
  const {
    step,
    pendingUser,
    signInWithProvider,
    signInAsAdmin,
    submitPhone,
    backToProviders,
    loading,
    error,
  } = useLogin();

  // Con sesión activa la vista de login no existe: se desplaza a la app.
  useEffect(() => {
    if (!isHydrating && user) {
      router.replace(isAdmin ? "/admin" : "/booking");
    }
  }, [isHydrating, user, isAdmin, router]);

  if (!isHydrating && user) {
    return null;
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:py-12">
      <section className="grid gap-6 md:grid-cols-2 md:items-center">
        <div className="flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800">
            <CalendarHeart className="h-3.5 w-3.5" aria-hidden />
            Autogestión de reservas
          </span>
          <h1 className="text-3xl font-semibold text-violet-900 md:text-4xl">
            Agenda tu cita en {SALON_LOCATION.name} sin esperar respuesta
          </h1>
          <p className="text-gray-600">
            Consulta la disponibilidad real del salón, reserva tu franja en línea y recibe
            tu confirmación al instante. Sin mensajería, sin esperas, sin perder tu turno.
          </p>
          <div className="rounded-xl border border-violet-100 bg-white p-4 text-sm text-gray-700">
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden />
              <span>
                <strong>Dirección física:</strong> {SALON_LOCATION.fullAddress}
              </span>
            </p>
            <p className="mt-1 flex items-start gap-2">
              <Fingerprint className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden />
              <span>
                <strong>Horario:</strong> {SALON_LOCATION.openingHours}
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
          {step === "providers" ? (
            <ProvidersStep
              loading={loading}
              error={error}
              onProvider={signInWithProvider}
              onAdmin={signInAsAdmin}
            />
          ) : (
            <PhoneStep
              userName={pendingUser?.fullName ?? ""}
              loading={loading}
              error={error}
              onSubmitPhone={submitPhone}
              onBack={backToProviders}
            />
          )}
        </div>
      </section>
    </main>
  );
}

type ProvidersStepProps = {
  loading: boolean;
  error: string | null;
  onProvider: (provider: "GOOGLE" | "FACEBOOK" | "APPLE") => void;
  onAdmin: () => void;
};

/** Paso 1: elección del proveedor federado (simulado con cuentas de prueba). */
function ProvidersStep({ loading, error, onProvider, onAdmin }: ProvidersStepProps) {
  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900">Inicia sesión</h2>
      <p className="mt-1 text-sm text-gray-600">
        Accede con tu proveedor de identidad federado y pasa directo a reservar tu cita.
      </p>

      {error && (
        <div className="mt-4">
          <AlertBanner kind="error" message={error} />
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => onProvider("GOOGLE")}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-violet-50 disabled:opacity-60"
        >
          <Globe className="h-4 w-4 text-violet-600" aria-hidden />
          {loading ? "Ingresando…" : "Continuar con Google"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => onProvider("FACEBOOK")}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-violet-50 disabled:opacity-60"
        >
          <Globe className="h-4 w-4 text-sky-600" aria-hidden />
          Continuar con Facebook
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => onProvider("APPLE")}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-violet-50 disabled:opacity-60"
        >
          <ShieldCheck className="h-4 w-4 text-gray-700" aria-hidden />
          Continuar con Apple
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-gray-500">
        Demo académica: cada proveedor ingresa con una cuenta de cliente de prueba.
      </p>

      <div className="mt-2 border-t border-gray-100 pt-3 text-center">
        <button
          type="button"
          disabled={loading}
          onClick={onAdmin}
          className="text-xs font-medium text-gray-500 underline transition hover:text-violet-700 disabled:opacity-60"
        >
          Acceso del administrador del salón
        </button>
      </div>
    </>
  );
}

type PhoneStepProps = {
  userName: string;
  loading: boolean;
  error: string | null;
  onSubmitPhone: (phone: string) => void;
  onBack: () => void;
};

/**
 * Paso 2 (solo contactos nuevos): captura del celular.
 * Es el dato que el salón usa para confirmar y recordar citas, por eso se
 * pide aquí y no en un formulario posterior.
 */
function PhoneStep({ userName, loading, error, onSubmitPhone, onBack }: PhoneStepProps) {
  // useState local del input de teléfono (controlled input).
  const [phone, setPhone] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!phone.trim()) {
      setValidationError("Ingresa tu número de celular para continuar.");
      return;
    }
    setValidationError(null);
    onSubmitPhone(phone.trim());
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900">
        Bienvenida, {userName.split(" ")[0]}
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Para confirmar y recordarte tus citas usamos tu celular. ¿A qué número te
        contactamos?
      </p>

      {error && (
        <div className="mt-4">
          <AlertBanner kind="error" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="300 000 0000"
          autoFocus
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
        />
        {validationError && <p className="text-sm text-rose-700">{validationError}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          {loading ? "Guardando…" : "Guardar y continuar"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="text-xs font-medium text-gray-500 underline transition hover:text-violet-700 disabled:opacity-60"
        >
          Volver
        </button>
      </form>
    </>
  );
}
