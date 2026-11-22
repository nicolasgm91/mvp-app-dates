/**
 * Carga inicial de datos para el MVP (ejecutar con: pnpm exec prisma db seed).
 * Crea: usuario administrador, usuario cliente de prueba, 4 servicios con
 * duraciones diferenciadas y una reserva CONFIRMED de hoy para demostrar
 * visualmente los bloques ocupados y las validaciones de cruce.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Sembrando datos del Centro Estético Violeta...");

  // 1. Usuario administrador del salón.
  const admin = await prisma.user.upsert({
    where: { email: "admin@centroesteticovioleta.com" },
    update: {},
    create: {
      email: "admin@centroesteticovioleta.com",
      fullName: "Administrador Violeta",
      role: "ADMIN",
      authProvider: "GOOGLE",
      providerAccountId: "demo-admin-account",
    },
  });

  // 2. Cliente de prueba con proveedor federado simulado.
  const client = await prisma.user.upsert({
    where: { email: "laura.martinez@gmail.com" },
    update: {},
    create: {
      email: "laura.martinez@gmail.com",
      fullName: "Laura Martínez",
      role: "CLIENT",
      authProvider: "GOOGLE",
      providerAccountId: "demo-client-account",
      phone: "3001234567",
    },
  });

  // 3. Catálogo de servicios con duraciones dinámicas y precios en COP.
  const serviceCatalog = [
    {
      name: "Manicure tradicional",
      description: "Limpieza, corte y esmaltado clásico de uñas.",
      durationMinutes: 45,
      price: 35000,
    },
    {
      name: "Manicure semipermanente",
      description: "Esmaltado de larga duración con secado en cabina.",
      durationMinutes: 50,
      price: 55000,
    },
    {
      name: "Pedicure spa",
      description: "Exfoliación, hidratación y esmaltado de pies.",
      durationMinutes: 60,
      price: 48000,
    },
    {
      name: "Colorimetría y corte de puntas",
      description: "Diagnóstico de color y corte de mantenimiento.",
      durationMinutes: 75,
      price: 90000,
    },
  ];

  const services: { id: string }[] = [];
  for (const service of serviceCatalog) {
    const existing = await prisma.service.findFirst({
      where: { name: service.name },
      select: { id: true },
    });
    if (existing) {
      services.push(existing);
      continue;
    }
    services.push(
      await prisma.service.create({
        data: service,
        select: { id: true },
      }),
    );
  }

  // 4. Reserva de hoy en una franja próxima (9:00 a.m. local) para mostrar
  //    un bloque ocupado y poder provocar el 409 de cruce de horarios.
  const todayAt9 = new Date();
  todayAt9.setHours(9, 0, 0, 0);

  const hasTodayAppointment = await prisma.appointment.findFirst({
    where: {
      startTime: todayAt9,
      status: "CONFIRMED",
    },
    select: { id: true },
  });

  if (!hasTodayAppointment) {
    await prisma.appointment.create({
      data: {
        userId: client.id,
        serviceId: services[0]!.id,
        startTime: todayAt9,
        endTime: new Date(todayAt9.getTime() + 45 * 60_000),
        status: "CONFIRMED",
        channel: "WEB",
        locationConfirmed: true,
        notes: "Reserva de demostración del día.",
      },
    });
  }

  console.log(`Listo. Admin: ${admin.email} | Cliente: ${client.email} | Servicios: ${services.length}`);
}

main()
  .catch((error) => {
    console.error("Error ejecutando el seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
