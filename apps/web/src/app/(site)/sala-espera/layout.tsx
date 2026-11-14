import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sala de espera en vivo",
  description:
    "Mira en tiempo real la cola de atención de la clínica: pacientes en espera, prioridades y atenciones en curso.",
};

export default function QueueLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
