"use client";

/**
 * Banner de notificaciones reutilizable (éxito, error, información).
 * Los features lo usan para feedback inmediato del API sin toasts externos.
 */
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

export type AlertKind = "success" | "error" | "info";

type AlertBannerProps = {
  kind: AlertKind;
  message: string;
  onClose?: () => void;
};

const kindStyles: Record<AlertKind, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  info: "border-violet-200 bg-violet-50 text-violet-900",
};

const kindIcons: Record<AlertKind, typeof Info> = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
};

export function AlertBanner({ kind, message, onClose }: AlertBannerProps) {
  const Icon = kindIcons[kind];

  return (
    <div
      role="status"
      className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${kindStyles[kind]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p className="flex-1">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-0.5 opacity-60 hover:opacity-100"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
