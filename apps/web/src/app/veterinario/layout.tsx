import { PanelShell } from "@/components/panel-shell";

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
