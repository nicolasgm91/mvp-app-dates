/**
 * Declaración de tipos para swagger-ui-dist (distribución estática oficial de
 * Swagger UI). El paquete no trae tipos propios; esta declaración mínima basta
 * porque solo consumimos SwaggerUIBundle y sus presets.
 */
declare module "swagger-ui-dist/swagger-ui-bundle" {
  export interface SwaggerUIBundleOptions {
    url?: string;
    spec?: object;
    dom_id?: string;
    domNode?: HTMLElement;
    presets?: unknown[];
    deepLinking?: boolean;
    docExpansion?: string;
  }

  export const SwaggerUIBundle: (options: SwaggerUIBundleOptions) => void;
}
