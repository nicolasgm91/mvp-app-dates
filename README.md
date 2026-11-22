# Centro Estético Violeta — Sistema Web de Autogestión de Reservas (MVP)

Aplicación web full-stack y responsiva (*Mobile First*) para la autogestión de citas del **Centro Estético Violeta**. Proyecto de la **Actividad 4** de la electiva *Desarrollo de aplicaciones web* (Ingeniería de Software), que continúa la propuesta de la Actividad 2.

> **Alcance del MVP:** demostración funcional inicial. El inicio de sesión federado es **simulado** (cuentas de demostración que ejecutan el mismo flujo de upsert que haría un proveedor real) y el despliegue está **preparado** (rutas relativas, sin `localhost` quemado) pero no publicado.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript `strict` |
| Estilos | TailwindCSS 4 (clases utilitarias, paleta violeta/lavanda) |
| Base de datos | SQLite con **Prisma ORM 7** (+ `@prisma/adapter-better-sqlite3`) |
| Validación | **Zod** centralizado en `src/shared/contracts/` (compartido cliente ↔ servidor) |
| Cliente HTTP | **Axios** (instancia central con interceptores; *sin `fetch` nativo en el cliente*) |
| Documentación | OpenAPI 3.0 servida en `/api/docs` + **Swagger UI** en `/api-docs` |

## Arquitectura

```text
src/
├── shared/          # Contratos Zod + constantes compartidas (cliente ↔ servidor)
├── server/          # Backend N-capas, aislado del framework
│   ├── config/      # Singleton de PrismaClient + especificación OpenAPI
│   ├── errors/      # AppError (códigos HTTP de negocio)
│   ├── middlewares/ # withErrorHandler: ZodError→400, AppError→su código, otros→500
│   └── modules/     # auth, services, appointments (repository → service → controller)
├── client/          # Frontend modular
│   ├── core/        # axios.client + AuthContext
│   ├── shared/      # Navbar, AlertBanner
│   └── features/    # auth, booking, my-appointments, admin (api + hooks + vistas)
└── app/             # Router de Next.js: capa delgada, sin lógica de negocio
```

**Flujo de una petición:** vista → hook (`useX`) → `feature.api.ts` → `apiClient` (Axios) → Route Handler (`src/app/api/**`) → `withErrorHandler` → controller → service (reglas de negocio) → repository (Prisma) → SQLite.

## Puesta en marcha (local)

Requisitos: Node.js 20+ y pnpm 10+.

```bash
# 1. Instalar dependencias
pnpm install

# 2. Demo en un solo comando: genera el cliente, aplica la migración,
#    carga los datos semilla y levanta la aplicación
pnpm demo
```

Abrir `http://localhost:3000`. El archivo `.env` es opcional en local (la app usa `file:./dev.db` por defecto); copia `.env.example` si quieres externalizar la configuración.

<details>
<summary>Pasos equivalentes, uno por uno</summary>

```bash
# Generar el cliente Prisma y aplicar la migración
pnpm exec prisma generate
pnpm exec prisma migrate deploy

# Cargar datos iniciales (usuarios demo, catálogo y reserva de hoy)
pnpm exec prisma db seed

# Levantar la aplicación
pnpm dev
```

</details>

## Cuentas de demostración

| Rol | Credencial simulada | Cómo entrar |
|---|---|---|
| Cliente | `laura.martinez@gmail.com` | Botón "Continuar con Google" o "Entrar como cliente (demo)" |
| Administrador | `admin@centroesteticovioleta.com` | Botón "Entrar como administrador (demo)" |

## Endpoints de la API

Base URL relativa: `/api` — Documentación interactiva: **`/api-docs`** · Especificación JSON: **`/api/docs`**

| Método | Ruta | Descripción | Respuestas |
|---|---|---|---|
| `POST` | `/api/auth/federated` | Upsert del usuario a partir del proveedor de identidad | `200`, `400` |
| `GET` | `/api/services` | Servicios activos del catálogo (duración dinámica + precio) | `200` |
| `GET` | `/api/appointments` | Reservas con filtros `?userId=` y `?date=YYYY-MM-DD` | `200` |
| `POST` | `/api/appointments` | Crea reserva; calcula `endTime` y valida cruce de franjas | `201`, `400`, `404`, `409` |
| `DELETE` | `/api/appointments/{id}` | Cancela la reserva (estado `CANCELLED`) y libera la franja | `200`, `404` |
| `GET` | `/api/docs` | Especificación OpenAPI 3.0 en JSON | `200` |

**Reglas de negocio clave**

- `POST /api/appointments` con `channel: "WEB"` exige `locationConfirmed: true` (validado por un `.refine()` de Zod en `appointment.contract.ts` y revalidado en el servidor).
- El cruce de horarios se valida contra **toda** reserva `CONFIRMED` (agenda única, equidad entre canal web y presencial): `existing.startTime < newEndTime && existing.endTime > newStartTime` → `409 Conflict`.
- Cancelar no borra: cambia el estado a `CANCELLED`, de modo que la franja se libera al instante y queda historial para el cliente.

## Despliegue (preparado)

La aplicación no tiene URLs locales quemadas: todas las llamadas del cliente usan rutas relativas (`/api/...`) y la conexión a la base de datos sale del entorno (`DATABASE_URL`, ver `.env.example`).

Para llevarla a producción:

1. Cambiar el `datasource` de SQLite a un motor de servidor (por ejemplo PostgreSQL) en `prisma/schema.prisma` y regenerar migraciones.
2. Definir `DATABASE_URL` en el entorno del proveedor de hosting.
3. `pnpm build && pnpm start` (o la plataforma de su elección: Vercel, Railway, un VPS con proxy inverso).

## Autoría

Proyecto académico — Actividad 4, electiva *Desarrollo de aplicaciones web*, Corporación Universitaria Iberoamericana (2026).
