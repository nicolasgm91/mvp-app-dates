"use client";

/**
 * Página de documentación interactiva de la API.
 * Monta Swagger UI (distribución oficial swagger-ui-dist) apuntando al JSON
 * OpenAPI que expone /api/docs. Se ejecuta solo en el cliente porque el bundle
 * de Swagger UI manipula el DOM directamente.
 */
import { useEffect, useState } from "react";
import "swagger-ui-dist/swagger-ui.css";

export default function ApiDocsPage() {
  const [uiReady, setUiReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Carga dinámica del bundle en el cliente: mantiene el JS de Swagger UI
    // fuera del servidor y del primer render.
    void (async () => {
      // Interop de módulos: el bundle UMD de swagger-ui-dist puede exponer
      // SwaggerUIBundle como named export, como default plano o anidado en
      // default. Se resuelve de forma defensiva según cómo lo empaquete el bundler.
      type SwaggerBundle = (options: unknown) => void;
      type SwaggerBundleModule = {
        SwaggerUIBundle?: SwaggerBundle;
        default?: SwaggerBundle | { SwaggerUIBundle?: SwaggerBundle };
      };

      const bundleModule = (await import("swagger-ui-dist/swagger-ui-bundle")) as SwaggerBundleModule;
      if (cancelled) return;

      const resolved =
        bundleModule.SwaggerUIBundle ??
        (typeof bundleModule.default === "function" ? bundleModule.default : bundleModule.default?.SwaggerUIBundle);

      if (!resolved) {
        setLoadError(true);
        return;
      }

      resolved({
        url: "/api/docs",
        dom_id: "#swagger-ui",
        deepLinking: true,
        docExpansion: "list",
      });
      setUiReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-violet-100 bg-violet-50 px-4 py-3">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-lg font-semibold text-violet-900">
            Documentación de la API — Centro Estético Violeta
          </h1>
          <p className="text-sm text-gray-600">
            Especificación OpenAPI 3.0 servida en <code className="rounded bg-white px-1">/api/docs</code>
          </p>
          <p className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
            API pública solo con fines de pruebas y demostración académica: no
            requiere autenticación ni maneja datos reales.
          </p>
        </div>
      </header>
      <div id="swagger-ui" className="mx-auto max-w-6xl" />
      {!uiReady && !loadError && (
        <p className="py-6 text-center text-sm text-gray-500">Cargando Swagger UI…</p>
      )}
      {loadError && (
        <p className="py-6 text-center text-sm text-rose-700">
          No fue posible cargar Swagger UI. Verifica la especificación en{" "}
          <code className="rounded bg-gray-100 px-1">/api/docs</code>.
        </p>
      )}
    </main>
  );
}
