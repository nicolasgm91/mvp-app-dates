/**
 * Endpoint que expone la especificación OpenAPI 3.0 en formato JSON.
 * Es la fuente que consume tanto Swagger UI (/api-docs) como herramientas
 * externas de prueba (Thunder Client, Postman, etc.).
 */
import { NextResponse } from "next/server";
import { openApiSpecification } from "@/server/config/swagger";
import { SWAGGER_CACHE_MAX_AGE_SECONDS } from "@/shared/constants/time";

export const GET = () =>
  NextResponse.json(openApiSpecification, {
    status: 200,
    headers: {
      "Cache-Control": `public, max-age=${SWAGGER_CACHE_MAX_AGE_SECONDS}`,
    },
  });
