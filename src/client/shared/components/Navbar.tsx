"use client";

/**
 * Barra de navegación responsiva (Mobile First).
 * Muestra los accesos según el rol del usuario en sesión (Context API) y el
 * acceso siempre-visible a la documentación Swagger de la API.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarHeart, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/client/core/context/AuthContext";
import { SALON_LOCATION } from "@/shared/constants/appointment-states";

type NavLink = {
  href: string;
  label: string;
};

/** Enlaces según la sesión: anónimo ve lo público (Inicio = login);
 * con sesión, el login desaparece y se muestran las acciones de la app. */
function buildLinks(isLoggedIn: boolean, isAdmin: boolean): NavLink[] {
  if (!isLoggedIn) {
    return [
      { href: "/", label: "Inicio" },
      { href: "/api-docs", label: "API Docs" },
    ];
  }

  const links: NavLink[] = [
    { href: "/booking", label: "Reservar" },
    { href: "/my-appointments", label: "Mis reservas" },
  ];
  if (isAdmin) {
    links.push({ href: "/admin", label: "Agenda del salón" });
  }
  links.push({ href: "/api-docs", label: "API Docs" });
  return links;
}

export function Navbar() {
  const { user, isAdmin, logout, isHydrating } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = buildLinks(Boolean(user), isAdmin);

  const linkClasses = (href: string) =>
    `rounded-full px-3 py-1.5 text-sm transition-colors ${
      pathname === href
        ? "bg-violet-600 text-white"
        : "text-gray-700 hover:bg-violet-100 hover:text-violet-800"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-violet-100 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Link
          href={user ? "/booking" : "/"}
          className="flex items-center gap-2 font-semibold text-violet-800"
        >
          <CalendarHeart className="h-5 w-5" aria-hidden />
          <span>{SALON_LOCATION.name}</span>
        </Link>

        {/* Navegación de escritorio */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClasses(link.href)}>
              {link.label}
            </Link>
          ))}
          <SessionActions />
        </div>

        {/* Botón de menú en móvil */}
        <button
          type="button"
          className="rounded-full p-2 text-violet-800 hover:bg-violet-100 md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Navegación móvil */}
      {menuOpen && (
        <div className="flex flex-col gap-1 border-t border-violet-100 bg-white px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClasses(link.href)}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <SessionActions onAction={() => setMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}

/** Nombre del usuario y acción de salir, integrados a la barra derecha. */
function SessionActions({ onAction }: { onAction?: () => void }) {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const firstName = user.fullName.split(" ")[0];

  return (
    <div className="flex items-center gap-1">
      <span
        className="max-w-32 truncate rounded-full bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-900"
        title={user.fullName}
      >
        {firstName}
      </span>
      <button
        type="button"
        onClick={() => {
          logout();
          onAction?.();
        }}
        className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-700"
        aria-label={`Cerrar sesión de ${user.fullName}`}
      >
        <LogOut className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Salir</span>
      </button>
    </div>
  );
}
