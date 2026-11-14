import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tienda",
  description:
    "Alimentos, camas, antipulgas y accesorios para perros y gatos con stock actualizado. Coordina el recojo en clínica o el delivery.",
};

export default function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
