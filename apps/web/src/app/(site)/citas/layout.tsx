import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agendar cita",
  description:
    "Reserva una cita veterinaria sin crear cuenta: elige el servicio, la fecha y recibe tu código de seguimiento.",
};

export default function AppointmentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
