import { PanelShell } from "@/components/panel-shell";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PanelShell
      panel="admin"
      title="Panel de administración"
      subtitle="Citas, inventario y supervisión de la clínica"
    >
      {children}
    </PanelShell>
  );
}
