"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BadgeCheck,
  KeyRound,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  UserCog,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { StaffAvatar } from "@/components/placeholders";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { LoadingBlock } from "@/components/ui/spinner";
import { apiFetch, describeApiError } from "@/lib/api";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { useAuth } from "@/lib/hooks/use-auth";
import { formatDateTime } from "@/lib/format";
import type { AdminStaff, StaffRole } from "@/lib/types";

const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: "Administrador/a",
  VETERINARIAN: "Veterinario/a",
};

function StaffFormDialog({
  user,
  currentUserId,
  onClose,
  onSaved,
}: {
  user: AdminStaff | null;
  currentUserId: number | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const isSelf = user !== null && user.id === currentUserId;

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>(user?.role ?? "VETERINARIAN");
  const [specialty, setSpecialty] = useState(user?.specialty ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [active, setActive] = useState(user?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Ingresa el nombre completo.");
      return;
    }

    if (!user && password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password && password.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        specialty: specialty.trim() || null,
        bio: bio.trim() || null,
        active,
      };

      if (password) body.password = password;

      if (user) {
        await apiFetch(`/api/admin/staff/${user.id}`, {
          method: "PATCH",
          body,
        });
        onSaved(`Usuario "${fullName.trim()}" actualizado.`);
      } else {
        await apiFetch("/api/admin/staff", { method: "POST", body });
        onSaved(`Usuario "${fullName.trim()}" creado.`);
      }

      onClose();
    } catch (caught) {
      setError(describeApiError(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-2xl rounded-2xl border border-stone-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              {user ? "Editar usuario" : "Nuevo usuario"}
            </h2>
            <p className="text-sm text-stone-500">
              {user
                ? "Actualiza sus datos de acceso y su perfil público."
                : "Crea una cuenta para que pueda entrar al panel."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            aria-label="Cerrar formulario"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo" htmlFor="staff-name" required>
              <Input
                id="staff-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Ej. Dra. Lucía Ramos"
                minLength={3}
                maxLength={120}
                required
              />
            </Field>

            <Field label="Correo" htmlFor="staff-email" required>
              <Input
                id="staff-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nombre@chanlievet.pe"
                maxLength={160}
                required
              />
            </Field>

            <Field
              label={user ? "Nueva contraseña" : "Contraseña"}
              htmlFor="staff-password"
              required={!user}
              hint={
                user
                  ? "Déjala vacía para conservar la contraseña actual."
                  : "Mínimo 8 caracteres."
              }
            >
              <Input
                id="staff-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={user ? "••••••••" : "Mínimo 8 caracteres"}
                minLength={8}
                maxLength={200}
                required={!user}
              />
            </Field>

            <Field label="Rol" htmlFor="staff-role" required>
              <Select
                id="staff-role"
                value={role}
                onChange={(event) => setRole(event.target.value as StaffRole)}
                disabled={isSelf}
              >
                <option value="VETERINARIAN">Veterinario/a</option>
                <option value="ADMIN">Administrador/a</option>
              </Select>
            </Field>

            <Field
              label="Especialidad"
              htmlFor="staff-specialty"
              hint="Visible en la sección del equipo."
              className="sm:col-span-2"
            >
              <Input
                id="staff-specialty"
                value={specialty}
                onChange={(event) => setSpecialty(event.target.value)}
                placeholder="Ej. Dermatología, medicina felina..."
                maxLength={120}
              />
            </Field>
          </div>

          <Field
            label="Presentación"
            htmlFor="staff-bio"
            hint="Breve descripción para la web pública (opcional)."
          >
            <Textarea
              id="staff-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Cuéntale a los clientes cómo es tu trato con las mascotas."
              maxLength={500}
            />
          </Field>

          {user ? (
            <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                disabled={isSelf}
                className="size-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
              />
              Cuenta activa (puede iniciar sesión)
            </label>
          ) : null}

          {isSelf ? (
            <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-800">
              Estás editando tu propia cuenta. Por seguridad no puedes quitarte
              el rol de administrador ni desactivarla.
            </p>
          ) : null}

          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Guardando..."
                : user
                  ? "Guardar cambios"
                  : "Crear usuario"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminStaffPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminStaff | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<AdminStaff | null>(
    null,
  );
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const staffQuery = useApiQuery<{ staff: AdminStaff[]; total: number }>(
    "/api/admin/staff",
  );

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const filtered = useMemo(() => {
    const list = staffQuery.data?.staff ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;

    return list.filter((member) =>
      [member.fullName, member.email, member.specialty ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [staffQuery.data, search]);

  const summary = useMemo(() => {
    const list = staffQuery.data?.staff ?? [];
    return {
      total: list.length,
      active: list.filter((member) => member.active).length,
      admins: list.filter((member) => member.role === "ADMIN" && member.active)
        .length,
    };
  }, [staffQuery.data]);

  function openCreate() {
    setEditing(null);
    setActionError(null);
    setFormOpen(true);
  }

  function openEdit(member: AdminStaff) {
    setEditing(member);
    setActionError(null);
    setFormOpen(true);
  }

  async function setActive(member: AdminStaff, active: boolean) {
    setBusy(member.id);
    setActionError(null);

    try {
      await apiFetch(`/api/admin/staff/${member.id}`, {
        method: "PATCH",
        body: { active },
      });
      setMessage(
        `Cuenta de ${member.fullName} ${active ? "reactivada" : "desactivada"}.`,
      );
      setPendingDeactivate(null);
      staffQuery.refetch();
    } catch (caught) {
      setActionError(describeApiError(caught));
    } finally {
      setBusy(null);
    }
  }

  async function deactivate(member: AdminStaff) {
    setBusy(member.id);
    setActionError(null);

    try {
      await apiFetch(`/api/admin/staff/${member.id}`, { method: "DELETE" });
      setMessage(`Cuenta de ${member.fullName} desactivada.`);
      setPendingDeactivate(null);
      staffQuery.refetch();
    } catch (caught) {
      setActionError(describeApiError(caught));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {formOpen ? (
        <StaffFormDialog
          user={editing}
          currentUserId={currentUser?.id ?? null}
          onClose={() => setFormOpen(false)}
          onSaved={(savedMessage) => {
            setMessage(savedMessage);
            staffQuery.refetch();
          }}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900">
            Usuarios del equipo
          </h2>
          <p className="text-sm text-stone-500">
            Crea cuentas, cambia roles y desactiva accesos sin perder el
            historial de citas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={staffQuery.refetch}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
          <Button size="sm" onClick={openCreate}>
            <UserPlus className="size-4" />
            Nuevo usuario
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Usuarios
          </p>
          <p className="mt-1 text-2xl font-bold text-stone-900">
            {summary.total}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Activos
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {summary.active}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Administradores activos
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-700">
            {summary.admins}
          </p>
        </div>
      </div>

      {actionError ? (
        <Alert variant="error" title="No se pudo actualizar el usuario">
          {actionError}
        </Alert>
      ) : null}

      {message ? <Alert variant="success">{message}</Alert> : null}

      <Card>
        <div className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, correo o especialidad"
              className="pl-10"
              aria-label="Buscar usuarios del equipo"
            />
          </div>
        </div>
      </Card>

      {staffQuery.loading ? (
        <LoadingBlock label="Cargando usuarios..." />
      ) : staffQuery.error ? (
        <Alert variant="error" title="No pudimos cargar los usuarios">
          <p>{staffQuery.error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={staffQuery.refetch}
          >
            Reintentar
          </Button>
        </Alert>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UsersRound className="size-6" />}
          title="No encontramos usuarios"
          description={
            search
              ? "Prueba con otro nombre, correo o especialidad."
              : "Crea la primera cuenta del equipo para empezar."
          }
          action={
            search ? (
              <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                Limpiar búsqueda
              </Button>
            ) : (
              <Button size="sm" onClick={openCreate}>
                <UserPlus className="size-4" />
                Nuevo usuario
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((member) => {
            const isSelf = member.id === currentUser?.id;
            const memberBusy = busy === member.id;

            return (
              <Card key={member.id}>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <StaffAvatar
                        name={member.fullName}
                        avatarUrl={member.avatarUrl}
                        size="sm"
                      />
                      <span className="min-w-0">
                        <span className="block truncate">{member.fullName}</span>
                        <span className="block truncate text-xs font-normal text-stone-500">
                          {member.email}
                        </span>
                      </span>
                    </span>
                  }
                  description={
                    member.specialty ||
                    (member.role === "ADMIN"
                      ? "Acceso completo al panel"
                      : "Atención clínica")
                  }
                  action={
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <Badge tone={member.role === "ADMIN" ? "violet" : "brand"}>
                        {member.role === "ADMIN" ? (
                          <ShieldCheck className="size-3" />
                        ) : (
                          <UserCog className="size-3" />
                        )}
                        {ROLE_LABELS[member.role]}
                      </Badge>
                      <Badge tone={member.active ? "emerald" : "neutral"}>
                        {member.active ? (
                          <BadgeCheck className="size-3" />
                        ) : (
                          <ShieldX className="size-3" />
                        )}
                        {member.active ? "Activo" : "Inactivo"}
                      </Badge>
                      {isSelf ? <Badge tone="sky">Tu cuenta</Badge> : null}
                    </div>
                  }
                />

                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-400">
                    <span>
                      {member.appointmentsCount} cita(s) asignada(s)
                    </span>
                    <span>Creado el {formatDateTime(member.createdAt)}</span>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(member)}
                    >
                      <Pencil className="size-3.5" />
                      Editar
                    </Button>

                    {member.active ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setPendingDeactivate(member)}
                        disabled={isSelf || memberBusy}
                        title={
                          isSelf
                            ? "No puedes desactivar tu propia cuenta"
                            : undefined
                        }
                      >
                        <ShieldX className="size-3.5" />
                        {memberBusy ? "Desactivando..." : "Desactivar"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => void setActive(member, true)}
                        disabled={memberBusy}
                      >
                        <KeyRound className="size-3.5" />
                        {memberBusy ? "Activando..." : "Reactivar"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pendingDeactivate !== null}
        tone="danger"
        title="¿Desactivar esta cuenta?"
        description={
          pendingDeactivate
            ? `${pendingDeactivate.fullName} ya no podrá iniciar sesión ni recibir nuevas citas. Sus citas anteriores se conservan y puedes reactivar la cuenta cuando quieras.`
            : undefined
        }
        confirmLabel="Sí, desactivar"
        cancelLabel="Volver"
        busy={
          pendingDeactivate !== null && busy === pendingDeactivate.id
        }
        onCancel={() => setPendingDeactivate(null)}
        onConfirm={() => {
          if (!pendingDeactivate) return;
          void deactivate(pendingDeactivate);
        }}
      />
    </div>
  );
}
