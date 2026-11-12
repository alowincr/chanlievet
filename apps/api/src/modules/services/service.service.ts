import { prisma } from "../../lib/prisma";
import type { ServiceDTO } from "../../types/dto";

export async function listServices(): Promise<ServiceDTO[]> {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  });

  return services.map((service) => ({
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    price: service.price.toNumber(),
    durationMin: service.durationMin,
  }));
}
