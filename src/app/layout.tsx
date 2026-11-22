import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/client/core/context/AuthContext";
import { Navbar } from "@/client/shared/components/Navbar";
import { SALON_LOCATION } from "@/shared/constants/appointment-states";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${SALON_LOCATION.name} — Autogestión de reservas`,
  description:
    "Sistema web de autogestión de reservas para el Centro Estético Violeta: consulta el catálogo, elige tu franja y confirma tu cita en línea.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-violet-50/40 text-gray-900"
      >
        {/* Context API de sesión envuelve toda la aplicación (S7 de la SPEC). */}
        <AuthProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-violet-100 bg-white px-4 py-4 text-center text-xs text-gray-500">
            {SALON_LOCATION.name} · {SALON_LOCATION.fullAddress} · {SALON_LOCATION.openingHours}
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
