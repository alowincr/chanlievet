/**
 * Seed de demostración de ChanlieVet.
 *
 * Ejecutar con: npm run db:seed
 * Es idempotente: si ya existen usuarios de staff, no vuelve a sembrar.
 */
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";
import { limaDateKey, limaMidnightUtc } from "../src/lib/time";

const DEMO_PASSWORD = "chanlievet123";

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Hora fija del calendario de Lima, sin depender del huso del servidor. */
function atLimaTime(date: Date, hours: number, minutes = 0): Date {
  const midnight = limaMidnightUtc(limaDateKey(date));
  return new Date(midnight.getTime() + (hours * 60 + minutes) * 60_000);
}

interface SeedStaffProfile {
  fullName: string;
  email: string;
  role: "ADMIN" | "VETERINARIAN";
  specialty: string | null;
  bio: string | null;
}

const STAFF_PROFILES: SeedStaffProfile[] = [
  {
    fullName: "Dra. Valeria Chanlie",
    email: "admin@chanlievet.pe",
    role: "ADMIN",
    specialty: "Dirección médica",
    bio: "Fundadora de ChanlieVet. Supervisa la atención clínica y el seguimiento de cada caso.",
  },
  {
    fullName: "Dr. Marco Quispe",
    email: "vet@chanlievet.pe",
    role: "VETERINARIAN",
    specialty: "Medicina interna",
    bio: "Diagnóstico y tratamiento de perros adultos, con especial interés en salud digestiva.",
  },
  {
    fullName: "Dra. Lucía Ramos",
    email: "lramos@chanlievet.pe",
    role: "VETERINARIAN",
    specialty: "Dermatología",
    bio: "Alergias, hongos y problemas de piel. Trabaja con planes de tratamiento simples de seguir.",
  },
  {
    fullName: "Dra. Camila Rojas",
    email: "crojas@chanlievet.pe",
    role: "VETERINARIAN",
    specialty: "Medicina felina",
    bio: "Atención de gatos con manejo de bajo estrés y seguimiento cercano a cada familia.",
  },
  {
    fullName: "Dr. Diego Salazar",
    email: "dsalazar@chanlievet.pe",
    role: "VETERINARIAN",
    specialty: "Cirugía y traumatología",
    bio: "Evaluación de cojeras, heridas y recuperación postoperatoria en perros y gatos.",
  },
];

async function main(): Promise<void> {
  const existingStaff = await prisma.staffUser.count();
  const passwordHash = hashPassword(DEMO_PASSWORD);

  if (existingStaff > 0) {
    // Las bases ya sembradas no se borran. Solo se completan los perfiles
    // públicos (especialidad y presentación) y se agregan los integrantes
    // de demostración que falten, para que el carrusel del equipo tenga
    // contenido sin tocar citas ni datos reales.
    for (const profile of STAFF_PROFILES) {
      await prisma.staffUser.upsert({
        where: { email: profile.email },
        update: { specialty: profile.specialty, bio: profile.bio },
        create: {
          fullName: profile.fullName,
          email: profile.email,
          passwordHash,
          role: profile.role,
          specialty: profile.specialty,
          bio: profile.bio,
        },
      });
    }

    console.log(
      "ℹ️  La base de datos ya contiene datos. Se actualizaron los perfiles del equipo.",
    );
    return;
  }

  const now = new Date();

  // -------------------------------------------------------------------------
  // Personal
  // -------------------------------------------------------------------------
  const adminProfile = STAFF_PROFILES[0]!;
  const marcoProfile = STAFF_PROFILES[1]!;
  const luciaProfile = STAFF_PROFILES[2]!;

  const admin = await prisma.staffUser.create({
    data: {
      fullName: adminProfile.fullName,
      email: adminProfile.email,
      passwordHash,
      role: adminProfile.role,
      specialty: adminProfile.specialty,
      bio: adminProfile.bio,
    },
  });

  const marco = await prisma.staffUser.create({
    data: {
      fullName: marcoProfile.fullName,
      email: marcoProfile.email,
      passwordHash,
      role: marcoProfile.role,
      specialty: marcoProfile.specialty,
      bio: marcoProfile.bio,
    },
  });

  const lucia = await prisma.staffUser.create({
    data: {
      fullName: luciaProfile.fullName,
      email: luciaProfile.email,
      passwordHash,
      role: luciaProfile.role,
      specialty: luciaProfile.specialty,
      bio: luciaProfile.bio,
    },
  });

  for (const profile of STAFF_PROFILES.slice(3)) {
    await prisma.staffUser.create({
      data: {
        fullName: profile.fullName,
        email: profile.email,
        passwordHash,
        role: profile.role,
        specialty: profile.specialty,
        bio: profile.bio,
      },
    });
  }

  // -------------------------------------------------------------------------
  // Servicios
  // -------------------------------------------------------------------------
  const servicesData = [
    {
      name: "Consulta general",
      slug: "consulta-general",
      description: "Evaluación clínica completa de tu mascota con un veterinario.",
      price: 45,
      durationMin: 30,
    },
    {
      name: "Vacunación",
      slug: "vacunacion",
      description: "Aplicación de vacunas con carné y seguimiento del esquema.",
      price: 65,
      durationMin: 20,
    },
    {
      name: "Desparasitación",
      slug: "desparasitacion",
      description: "Control de parásitos internos y externos según peso y edad.",
      price: 40,
      durationMin: 20,
    },
    {
      name: "Baño y corte",
      slug: "bano-y-corte",
      description: "Baño medicado, secado, corte de uñas y limpieza de oídos.",
      price: 55,
      durationMin: 60,
    },
    {
      name: "Evaluación dermatológica",
      slug: "evaluacion-dermatologica",
      description: "Diagnóstico de alergias, hongos y problemas de piel.",
      price: 75,
      durationMin: 40,
    },
    {
      name: "Emergencia",
      slug: "emergencia",
      description: "Atención prioritaria para casos críticos durante el horario.",
      price: 90,
      durationMin: 45,
    },
  ];

  const serviceIds = new Map<string, number>();
  for (const service of servicesData) {
    const created = await prisma.service.create({ data: service });
    serviceIds.set(service.slug, created.id);
  }

  const serviceId = (slug: string): number => {
    const id = serviceIds.get(slug);
    if (!id) throw new Error(`Servicio no encontrado en el seed: ${slug}`);
    return id;
  };

  // -------------------------------------------------------------------------
  // Tienda: categorías y productos
  // -------------------------------------------------------------------------
  const categoriesData = [
    {
      name: "Alimentos",
      slug: "alimentos",
      description: "Comida balanceada, húmeda y snacks para perros y gatos.",
    },
    {
      name: "Camas y descanso",
      slug: "camas-y-descanso",
      description: "Camas, colchonetas y mantas para un descanso cómodo.",
    },
    {
      name: "Desparasitantes",
      slug: "desparasitantes",
      description: "Pipetas, collares y antiparasitarios orales.",
    },
    {
      name: "Higiene y cuidado",
      slug: "higiene-y-cuidado",
      description: "Shampoos, arenas sanitarias y productos de limpieza.",
    },
    {
      name: "Juguetes y accesorios",
      slug: "juguetes-y-accesorios",
      description: "Juguetes, rascadores y accesorios para el día a día.",
    },
  ];

  const categoryIds = new Map<string, number>();
  for (const category of categoriesData) {
    const created = await prisma.category.create({ data: category });
    categoryIds.set(category.slug, created.id);
  }

  const categoryId = (slug: string): number => {
    const id = categoryIds.get(slug);
    if (!id) throw new Error(`Categoría no encontrada en el seed: ${slug}`);
    return id;
  };

  const productsData = [
    {
      name: "Croquetas Adulto Pollo 3 kg",
      slug: "croquetas-adulto-pollo-3kg",
      description: "Alimento completo y balanceado para perros adultos de talla mediana.",
      price: 64.9,
      stock: 24,
      audience: "DOG" as const,
      category: "alimentos",
    },
    {
      name: "Croquetas Cachorro Cordero 2 kg",
      slug: "croquetas-cachorro-cordero-2kg",
      description: "Fórmula para cachorros con DHA y proteína de cordero.",
      price: 58.5,
      stock: 3,
      audience: "DOG" as const,
      category: "alimentos",
    },
    {
      name: "Pouch Gato Adulto Salmón 85 g",
      slug: "pouch-gato-adulto-salmon-85g",
      description: "Alimento húmedo de salmón, alto en proteína y humedad.",
      price: 4.9,
      stock: 60,
      audience: "CAT" as const,
      category: "alimentos",
    },
    {
      name: "Croquetas Gato Esterilizado 1.5 kg",
      slug: "croquetas-gato-esterilizado-1-5kg",
      description: "Control de peso y salud urinaria para gatos esterilizados.",
      price: 52,
      stock: 12,
      audience: "CAT" as const,
      category: "alimentos",
    },
    {
      name: "Snacks Dentales para Perro 180 g",
      slug: "snacks-dentales-perro-180g",
      description: "Galletas dentales que ayudan a reducir el sarro.",
      price: 18.9,
      stock: 0,
      audience: "DOG" as const,
      category: "alimentos",
    },
    {
      name: "Cama Acolchada Antiestrés 60 cm",
      slug: "cama-acolchada-antiestres-60cm",
      description: "Cama redonda de peluche suave para gatos y perros pequeños.",
      price: 79.9,
      stock: 8,
      audience: "CAT" as const,
      category: "camas-y-descanso",
    },
    {
      name: "Cama Nido Grande para Perro",
      slug: "cama-nido-grande-perro",
      description: "Cama amplia con bordes reforzados para perros medianos y grandes.",
      price: 119.9,
      stock: 2,
      audience: "DOG" as const,
      category: "camas-y-descanso",
    },
    {
      name: "Manta Polar Lavable",
      slug: "manta-polar-lavable",
      description: "Manta térmica y lavable, ideal para el frío de Lima Este.",
      price: 34.9,
      stock: 15,
      audience: "ALL" as const,
      category: "camas-y-descanso",
    },
    {
      name: "Antipulgas Pipeta 10-20 kg",
      slug: "antipulgas-pipeta-10-20kg",
      description: "Pipeta de acción rápida contra pulgas y garrapatas.",
      price: 39.9,
      stock: 18,
      audience: "DOG" as const,
      category: "desparasitantes",
    },
    {
      name: "Desparasitante Oral Perro 10 kg",
      slug: "desparasitante-oral-perro-10kg",
      description: "Tableta de amplio espectro para parásitos internos.",
      price: 25,
      stock: 4,
      audience: "DOG" as const,
      category: "desparasitantes",
    },
    {
      name: "Pipeta Antipulgas Gatos",
      slug: "pipeta-antipulgas-gatos",
      description: "Protección mensual contra pulgas para gatos de 2 a 5 kg.",
      price: 36.5,
      stock: 9,
      audience: "CAT" as const,
      category: "desparasitantes",
    },
    {
      name: "Collar Antipulgas 8 meses",
      slug: "collar-antipulgas-8-meses",
      description: "Collar de liberación prolongada resistente al agua.",
      price: 44,
      stock: 6,
      audience: "ALL" as const,
      category: "desparasitantes",
    },
    {
      name: "Shampoo Hipoalergénico 500 ml",
      slug: "shampoo-hipoalergenico-500ml",
      description: "Shampoo suave para pieles sensibles, con avena y aloe vera.",
      price: 29.9,
      stock: 20,
      audience: "ALL" as const,
      category: "higiene-y-cuidado",
    },
    {
      name: "Arena Sanitaria Aglomerante 10 kg",
      slug: "arena-sanitaria-aglomerante-10kg",
      description: "Arena de rápida absorción y control de olores.",
      price: 32.9,
      stock: 14,
      audience: "CAT" as const,
      category: "higiene-y-cuidado",
    },
    {
      name: "Kong Juguete Dental",
      slug: "kong-juguete-dental",
      description: "Juguete resistente que masajea encías y entretiene.",
      price: 27.9,
      stock: 10,
      audience: "DOG" as const,
      category: "juguetes-y-accesorios",
    },
    {
      name: "Ratón de Peluche con Cascabel",
      slug: "raton-peluche-cascabel",
      description: "Juguete clásico para gatos con sonido y movimiento.",
      price: 9.9,
      stock: 30,
      audience: "CAT" as const,
      category: "juguetes-y-accesorios",
    },
  ];

  await prisma.product.createMany({
    data: productsData.map(({ category, ...product }) => ({
      ...product,
      categoryId: categoryId(category),
    })),
  });

  // -------------------------------------------------------------------------
  // Dueños, mascotas y citas
  // -------------------------------------------------------------------------
  const rosa = await prisma.owner.create({
    data: {
      fullName: "Rosa Huamán",
      phone: "987654321",
      email: "rosa.huaman@example.com",
    },
  });
  const carlos = await prisma.owner.create({
    data: {
      fullName: "Carlos Mendoza",
      phone: "912345678",
      email: "carlos.mendoza@example.com",
    },
  });
  const ana = await prisma.owner.create({
    data: {
      fullName: "Ana Torres",
      phone: "955112233",
    },
  });
  const jose = await prisma.owner.create({
    data: {
      fullName: "José Paredes",
      phone: "944556677",
    },
  });
  const maria = await prisma.owner.create({
    data: {
      fullName: "María Flores",
      phone: "933221144",
      email: "maria.flores@example.com",
    },
  });

  const firulais = await prisma.pet.create({
    data: {
      ownerId: rosa.id,
      name: "Firulais",
      species: "DOG",
      breed: "Mestizo",
      birthDate: new Date("2022-03-15"),
    },
  });
  const michi = await prisma.pet.create({
    data: {
      ownerId: carlos.id,
      name: "Michi",
      species: "CAT",
      breed: "Siamés",
      birthDate: new Date("2023-06-10"),
    },
  });
  const luna = await prisma.pet.create({
    data: {
      ownerId: ana.id,
      name: "Luna",
      species: "DOG",
      breed: "Golden Retriever",
      birthDate: new Date("2020-11-02"),
    },
  });
  const rocky = await prisma.pet.create({
    data: {
      ownerId: jose.id,
      name: "Rocky",
      species: "DOG",
      breed: "Bulldog Francés",
      birthDate: new Date("2024-05-20"),
    },
  });
  const pelusa = await prisma.pet.create({
    data: {
      ownerId: maria.id,
      name: "Pelusa",
      species: "CAT",
      breed: "Persa",
      birthDate: new Date("2021-08-08"),
    },
  });

  const tomorrow = addDays(now, 1);

  await prisma.appointment.createMany({
    data: [
      {
        code: "CV-7K2M9A",
        ownerId: rosa.id,
        petId: firulais.id,
        serviceId: serviceId("consulta-general"),
        status: "WAITING",
        scheduledAt: addMinutes(now, 5),
        checkedInAt: addMinutes(now, -12),
        reason: "Cojera leve en la pata trasera derecha",
      },
      {
        code: "CV-4P8Q1B",
        ownerId: carlos.id,
        petId: michi.id,
        serviceId: serviceId("vacunacion"),
        status: "WAITING",
        scheduledAt: addMinutes(now, 20),
        checkedInAt: addMinutes(now, -4),
        reason: "Refuerzo de vacuna triple felina",
      },
      {
        code: "CV-9X3R6C",
        ownerId: ana.id,
        petId: luna.id,
        serviceId: serviceId("desparasitacion"),
        status: "IN_PROGRESS",
        scheduledAt: addMinutes(now, -15),
        checkedInAt: addMinutes(now, -20),
        startedAt: addMinutes(now, -8),
        assignedVetId: marco.id,
        reason: "Control de peso y desparasitación anual",
      },
      {
        code: "CV-2H5T8D",
        ownerId: jose.id,
        petId: rocky.id,
        serviceId: serviceId("bano-y-corte"),
        status: "CONFIRMED",
        scheduledAt: addMinutes(now, 90),
        reason: "Baño medicado por dermatitis",
      },
      {
        code: "CV-6J1V4E",
        ownerId: maria.id,
        petId: pelusa.id,
        serviceId: serviceId("consulta-general"),
        status: "PENDING",
        scheduledAt: atLimaTime(tomorrow, 9, 0),
        reason: "Pérdida de apetito en los últimos días",
      },
      {
        code: "CV-8N4W7F",
        ownerId: rosa.id,
        petId: firulais.id,
        serviceId: serviceId("vacunacion"),
        status: "PENDING",
        scheduledAt: atLimaTime(tomorrow, 11, 30),
        reason: "Vacuna antirrábica",
      },
      {
        code: "CV-3B9Y2G",
        ownerId: carlos.id,
        petId: michi.id,
        serviceId: serviceId("consulta-general"),
        status: "COMPLETED",
        scheduledAt: addMinutes(now, -120),
        checkedInAt: addMinutes(now, -135),
        startedAt: addMinutes(now, -125),
        finishedAt: addMinutes(now, -100),
        assignedVetId: lucia.id,
        reason: "Revisión general anual",
      },
      {
        code: "CV-5C7Z1H",
        ownerId: ana.id,
        petId: luna.id,
        serviceId: serviceId("bano-y-corte"),
        status: "CANCELLED",
        scheduledAt: addDays(now, -1),
        reason: "El cliente reprogramó la cita",
      },
    ],
  });

  console.log("✅ Seed completado.");
  console.log("   Usuarios de demo:");
  console.log(`   - Admin:      admin@chanlievet.pe / ${DEMO_PASSWORD}`);
  console.log(`   - Veterinario: vet@chanlievet.pe / ${DEMO_PASSWORD}`);
  console.log(`   - Admin id ${admin.id}, vets ${marco.id} y ${lucia.id}`);
}

main()
  .catch((error: unknown) => {
    console.error("❌ Error ejecutando el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
