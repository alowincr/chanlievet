import type { Metadata } from "next";
import { PanelShell } from "@/components/panel-shell";

export const metadata: Metadata = {
  title: "Panel veterinario",
  robots: { index: false, follow: false },
};

export default function VetLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PanelShell
      panel="vet"
      title="Panel veterinario"
      subtitle="Cola de atención y estados de las citas"
    >
      {children}
    </PanelShell>
  );
}
