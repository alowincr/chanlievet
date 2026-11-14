import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso del equipo",
  description:
    "Inicio de sesión para el personal de ChanlieVet. Área de demostración sin datos reales.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
