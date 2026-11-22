"use client";

/**
 * Componente presentacional de un servicio del catálogo.
 * Muestra nombre, descripción, duración dinámica y precio en COP; marca si el
 * servicio está dentro del carrito de la reserva (selección múltiple).
 */
import { Check, Clock, Tag } from "lucide-react";
import type { ServiceDto } from "@/client/shared/api/services.api";
import { formatCop } from "@/client/shared/utils/format";

type ServiceCardProps = {
  service: ServiceDto;
  selected: boolean;
  onToggle: (serviceId: string) => void;
};

export function ServiceCard({ service, selected, onToggle }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(service.id)}
      aria-pressed={selected}
      className={`flex h-full flex-col gap-2 rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200"
          : "border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="min-w-0 truncate font-semibold text-gray-900">{service.name}</h3>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
            selected ? "bg-violet-600 text-white" : "bg-violet-100 text-violet-800"
          }`}
        >
          {selected && <Check className="h-3 w-3" aria-hidden />}
          {selected ? "En el carrito" : "Agregar"}
        </span>
      </div>
      {service.description && (
        <p className="text-sm text-gray-600">{service.description}</p>
      )}
      <div className="mt-auto flex items-center justify-between text-sm text-gray-700">
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-violet-600" aria-hidden />
          {service.durationMinutes} min
        </span>
        <span className="flex items-center gap-1 font-medium">
          <Tag className="h-4 w-4 text-violet-600" aria-hidden />
          {formatCop(service.price)}        </span>
      </div>
    </button>
  );
}
