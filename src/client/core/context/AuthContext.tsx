"use client";

/**
 * Context API de autenticación y sesión.
 * Evidencia los hooks exigidos por la SPEC:
 * - useReducer: la máquina de estados LOGIN / LOGOUT / HYDRATE.
 * - useContext + hook personalizado useAuth(): acceso tipado al contexto.
 * - useEffect: sincronización de la sesión con localStorage (persistencia).
 *
 * En el MVP el login federado es simulado: el proveedor de identidad se
 * representa con los botones de la vista de login y el backend hace upsert.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { federatedLoginSchema } from "@/shared/contracts/auth.contract";
import type { FederatedLoginPayload } from "@/shared/contracts/auth.contract";
import { federatedLoginRequest } from "@/client/features/auth/auth.api";

/** Usuario autenticado (respuesta pública del backend). */
export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: "CLIENT" | "ADMIN";
  authProvider: "GOOGLE" | "FACEBOOK" | "APPLE";
};

/** Estados posibles de la sesión. */
export type AuthState = {
  user: AuthUser | null;
  /** true durante la primera lectura de localStorage (evita parpadeos de UI). */
  isHydrating: boolean;
};

/** Acciones de la máquina de estados de sesión. */
export type AuthAction =
  | { type: "HYDRATE"; user: AuthUser | null }
  | { type: "LOGIN"; user: AuthUser }
  | { type: "LOGOUT" };

/** Reducer puro: cada transición de sesión es explícita y trazable. */
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "HYDRATE":
      return { user: action.user, isHydrating: false };
    case "LOGIN":
      return { user: action.user, isHydrating: false };
    case "LOGOUT":
      return { user: null, isHydrating: false };
    default:
      return state;
  }
}

const AUTH_STORAGE_KEY = "violeta.session.user";

/** Forma del contexto expuesto por el proveedor. */
export type AuthContextValue = {
  user: AuthUser | null;
  isHydrating: boolean;
  isAdmin: boolean;
  login: (payload: FederatedLoginPayload) => Promise<AuthUser>;
  /** Guarda el teléfono capturado en el primer contacto (sesión + servidor ya notificado). */
  updateSessionPhone: (phone: string) => void;
  logout: () => void;
};

// El null inicial es la señal de "fuera de un AuthProvider".
export const AuthContext = createContext<AuthContextValue | null>(null);

/** Persistencia local de la sesión (solo datos públicos del usuario). */
function readStoredUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function storeUser(user: AuthUser | null) {
  try {
    if (user) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // localStorage puede fallar (modo privado, cuota); la sesión sigue en memoria.
  }
}

/**
 * Proveedor de sesión: envuelve la aplicación en el layout raíz y alimenta
 * Navbar, vistas y hooks con el usuario actual.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isHydrating: true,
  });

  // useEffect 1: al montar, rehidrata la sesión desde localStorage.
  useEffect(() => {
    dispatch({ type: "HYDRATE", user: readStoredUser() });
  }, []);

  // useEffect 2: cada cambio de sesión se persiste en localStorage.
  useEffect(() => {
    if (!state.isHydrating) {
      storeUser(state.user);
    }
  }, [state.user, state.isHydrating]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      isHydrating: state.isHydrating,
      isAdmin: state.user?.role === "ADMIN",
      login: async (payload) => {
        // Validación del payload con el MISMO contrato Zod que usa el servidor.
        const validated = federatedLoginSchema.parse(payload);
        // Toda petición pasa por la capa api del feature (instancia Axios central).
        const { data } = await federatedLoginRequest(validated);
        dispatch({ type: "LOGIN", user: data });
        // Devuelve el usuario para que el flujo de login decida el siguiente paso
        // (pedir teléfono si es un contacto nuevo, o desplazar a la app).
        return data;
      },
      updateSessionPhone: (phone) => {
        if (!state.user) return;
        dispatch({ type: "LOGIN", user: { ...state.user, phone } });
      },
      logout: () => {
        dispatch({ type: "LOGOUT" });
        // Navegación client-side (sin recarga): la vista "/" muestra el login.
        router.push("/");
      },
    }),
    [state.user, state.isHydrating, router],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook de acceso al contexto (envuelve useContext con tipado y error claro).
 * Cualquier componente que lo use fuera del AuthProvider falla rápido y claro.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>.");
  }
  return context;
}
