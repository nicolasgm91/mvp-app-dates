/**
 * Configuración central de la documentación OpenAPI 3.0.
 * La especificación completa vive aquí (una sola fuente de verdad) y se expone
 * en formato JSON desde /api/docs para que Swagger UI y herramientas externas
 * la consuman.
 */
export const openApiSpecification = {
  openapi: "3.0.3",
  info: {
    title: "API Centro Estético Violeta",
    version: "1.0.0",
    description:
      "API REST del sistema web de autogestión de reservas del Centro Estético Violeta. " +
      "Permite autenticación federada (simulada en el MVP), consulta del catálogo de " +
      "servicios, agendamiento con validación de concurrencia de franjas horarias, " +
      "cancelación de reservas y registro de turnos presenciales.",
    contact: {
      name: "Equipo Actividad 4 - Desarrollo de aplicaciones web",
    },
  },
  servers: [{ url: "/api", description: "Rutas relativas de la API" }],
  tags: [
    { name: "Auth", description: "Autenticación federada de usuarios" },
    { name: "Services", description: "Catálogo de servicios estéticos" },
    { name: "Appointments", description: "Reservas y agenda centralizada" },
  ],
  paths: {
    "/auth/federated": {
      post: {
        tags: ["Auth"],
        summary: "Inicia sesión con un proveedor de identidad federado",
        description:
          "Valida los datos entregados por el proveedor de identidad y realiza upsert " +
          "del usuario (lo crea si no existe, lo actualiza si ya existe). En el MVP el " +
          "proveedor es simulado con cuentas de demostración.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FederatedLoginPayload" },
            },
          },
        },
        responses: {
          "200": {
            description: "Usuario autenticado (creado o actualizado).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserResponse" },
              },
            },
          },
          "400": {
            description: "Payload inválido según el contrato Zod.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/walk-in": {
      post: {
        tags: ["Auth"],
        summary: "Registra o reconoce a un cliente presencial por su teléfono",
        description:
          "El TELÉFONO es la llave de identidad del cliente: si la persona ya está " +
          "registrada devuelve su misma cuenta (sin duplicar). El correo es opcional; " +
          "si no se entrega, se genera uno interno a partir del teléfono.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fullName", "phone"],
                properties: {
                  fullName: { type: "string", example: "María Torres" },
                  phone: { type: "string", example: "3001234567" },
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Cliente registrado o reconocido por su teléfono.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserResponse" },
              },
            },
          },
          "400": {
            description: "Datos inválidos (teléfono fuera del formato de 7-10 dígitos).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/phone": {
      patch: {
        tags: ["Auth"],
        summary: "Guarda el teléfono del usuario capturado en el primer contacto",
        description:
          "Regla de negocio: el celular es el principal canal de comunicación del salón, " +
          "por eso se solicita al crear la cuenta mediante autenticación federada.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "phone"],
                properties: {
                  userId: { type: "string" },
                  phone: { type: "string", example: "3001234567" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Teléfono actualizado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserResponse" },
              },
            },
          },
          "400": {
            description: "Teléfono inválido.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Usuario no encontrado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/services": {
      get: {
        tags: ["Services"],
        summary: "Lista los servicios estéticos activos del catálogo",
        responses: {
          "200": {
            description: "Servicios activos con su duración dinámica y precio.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ServiceResponse" },
                },
              },
            },
          },
        },
      },
    },
    "/appointments": {
      get: {
        tags: ["Appointments"],
        summary: "Lista reservas con filtros opcionales",
        parameters: [
          {
            name: "userId",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Filtra las reservas de un usuario específico.",
          },
          {
            name: "date",
            in: "query",
            required: false,
            schema: { type: "string", format: "date" },
            description: "Filtra las reservas de una fecha (YYYY-MM-DD).",
          },
        ],
        responses: {
          "200": {
            description:
              "Reservas con los datos del usuario y del servicio incluidos.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/AppointmentResponse" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Appointments"],
        summary: "Crea una reserva validando cruce de franjas horarias",
        description:
          "Calcula endTime según la duración del servicio y verifica que la franja no " +
          "se cruce con otra reserva CONFIRMED. Si hay cruce responde 409 Conflict; " +
          "las reservas por canal WEB exigen locationConfirmed = true.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateAppointmentPayload" },
            },
          },
        },
        responses: {
          "201": {
            description: "Reserva creada correctamente.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AppointmentResponse" },
              },
            },
          },
          "400": {
            description:
              "Payload inválido (incluye reservar WEB sin confirmar dirección o una franja pasada en canal WEB).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "El servicio seleccionado no existe.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "La franja horaria se cruza con otra reserva confirmada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/appointments/{id}": {
      delete: {
        tags: ["Appointments"],
        summary: "Cancela una reserva y libera su bloque horario",
        description:
          "No elimina el registro: cambia su estado a CANCELLED, de modo que la franja " +
          "queda inmediatamente disponible para otra reserva.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Identificador de la reserva.",
          },
        ],
        responses: {
          "200": {
            description: "Reserva cancelada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AppointmentResponse" },
              },
            },
          },
          "404": {
            description: "La reserva no existe.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      FederatedLoginPayload: {
        type: "object",
        required: ["email", "fullName", "authProvider"],
        properties: {
          email: { type: "string", format: "email", example: "laura.martinez@gmail.com" },
          fullName: { type: "string", example: "Laura Martínez" },
          authProvider: { type: "string", enum: ["GOOGLE", "FACEBOOK", "APPLE"] },
          providerAccountId: { type: "string" },
          phone: { type: "string", example: "3001234567" },
        },
      },
      CreateAppointmentPayload: {
        type: "object",
        required: ["userId", "serviceId", "startTime", "channel", "locationConfirmed"],
        properties: {
          userId: { type: "string" },
          serviceId: { type: "string" },
          startTime: { type: "string", format: "date-time", example: "2026-11-25T10:00:00.000Z" },
          channel: { type: "string", enum: ["WEB", "IN_PERSON"] },
          locationConfirmed: { type: "boolean", example: true },
          notes: { type: "string" },
        },
      },
      UserResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          fullName: { type: "string" },
          role: { type: "string", enum: ["CLIENT", "ADMIN"] },
          authProvider: { type: "string", enum: ["GOOGLE", "FACEBOOK", "APPLE"] },
          phone: { type: "string", nullable: true },
        },
      },
      ServiceResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "Manicure tradicional" },
          description: { type: "string", nullable: true },
          durationMinutes: { type: "integer", example: 45 },
          price: { type: "number", example: 35000 },
          isActive: { type: "boolean" },
        },
      },
      AppointmentResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          serviceId: { type: "string" },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["CONFIRMED", "CANCELLED", "COMPLETED"] },
          channel: { type: "string", enum: ["WEB", "IN_PERSON"] },
          locationConfirmed: { type: "boolean" },
          notes: { type: "string", nullable: true },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "La franja horaria seleccionada se cruza con otra reserva existente." },
          errors: {
            type: "array",
            nullable: true,
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                reason: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
} as const;
