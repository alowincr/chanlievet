import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seguimiento de cita",
  description:
    "Consulta el estado de tu cita, registra tu llegada y revisa tu posición en la sala de espera con tu código.",
};

export default function TrackingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
