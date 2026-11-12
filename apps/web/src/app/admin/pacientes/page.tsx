"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Clock,
  Mail,
  PawPrint,
  Phone,
  RefreshCw,
  Search,
  SearchX,
  UsersRound,
} from "lucide-react";
import { PetAvatar } from "@/components/placeholders";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { LoadingBlock } from "@/components/ui/spinner";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { formatDateTime, formatRelative } from "@/lib/format";
import type { PatientOwner } from "@/lib/types";

export default function AdminPatientsPage() {
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const path = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    params.set("limit", "100");
    return `/api/admin/patients?${params.toString()}`;
  }, [search]);

  const patients = useApiQuery<{ patients: PatientOwner[]; total: number }>(
    path,
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchDraft);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900">
            Pacientes y dueños
          </h2>
          <p className="text-sm text-stone-500">
            Aquí puedes consultar los datos de contacto y las mascotas
            registradas. Solo el personal autenticado tiene acceso.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={patients.refetch}>
          <RefreshCw className="size-4" />
          Actualizar
        </Button>
      </div>

      <Card>
        <div className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Buscar por dueño, celular, correo o mascota"
                className="pl-10"
                aria-label="Buscar pacientes"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                <Search className="size-4" />
                Buscar
              </Button>
              {search ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setSearchDraft("");
                  }}
                >
                  Limpiar
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      </Card>

      {patients.loading ? (
        <LoadingBlock label="Cargando pacientes..." />
      ) : patients.error ? (
        <Alert variant="error" title="No pudimos cargar los pacientes">
          <p>{patients.error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={patients.refetch}
          >
            Reintentar
          </Button>
        </Alert>
      ) : !patients.data || patients.data.patients.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-6" />}
          title="No encontramos pacientes"
          description={
            search
              ? "Prueba con otro nombre, celular o mascota."
              : "Las personas que reserven una cita aparecerán aquí."
          }
        />
      ) : (
        <>
          <p className="text-xs text-stone-400">
            {patients.data.total} dueño(s) registrado(s)
            {search ? ` para "${search}"` : ""}. Se muestran hasta 100.
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            {patients.data.patients.map((owner) => (
              <Card key={owner.id}>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <UsersRound className="size-4 text-brand-600" />
                      {owner.fullName}
                    </span>
                  }
                  description={`${owner.pets.length} mascota(s) · ${owner.appointmentsCount} cita(s)`}
                  action={
                    owner.lastVisitAt ? (
                      <Badge tone="sky">
                        Última: {formatRelative(owner.lastVisitAt)}
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Sin visitas</Badge>
                    )
                  }
                />
                <div className="space-y-3 p-4">
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <a
                      href={`tel:${owner.phone}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-stone-700 transition-colors hover:border-brand-300 hover:text-brand-700"
                    >
                      <Phone className="size-4 text-brand-600" />
                      {owner.phone}
                    </a>
                    {owner.email ? (
                      <a
                        href={`mailto:${owner.email}`}
                        className="inline-flex items-center gap-2 truncate rounded-xl border border-stone-200 px-3 py-2 text-stone-700 transition-colors hover:border-brand-300 hover:text-brand-700"
                      >
                        <Mail className="size-4 shrink-0 text-brand-600" />
                        <span className="truncate">{owner.email}</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-dashed border-stone-200 px-3 py-2 text-stone-400">
                        <Mail className="size-4" />
                        Sin correo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-stone-400">
                    <Clock className="size-3.5" />
                    Registrado el {formatDateTime(owner.createdAt)}
                  </div>

                  <div className="space-y-2">
                    {owner.pets.map((pet) => (
                      <div
                        key={pet.id}
                        className="flex items-center gap-3 rounded-xl bg-stone-50 px-3 py-2"
                      >
                        <PetAvatar
                          name={pet.name}
                          species={pet.species}
                          photoUrl={pet.photoUrl}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-stone-800">
                            {pet.name}
                            {pet.breed ? (
                              <span className="font-normal text-stone-400">
                                {" "}
                                · {pet.breed}
                              </span>
                            ) : null}
                          </p>
                          <p className="text-[11px] text-stone-400">
                            {pet.appointmentsCount} cita(s)
                            {pet.lastVisitAt
                              ? ` · última ${formatRelative(pet.lastVisitAt)}`
                              : " · sin visitas"}
                          </p>
                        </div>
                        {pet.birthDate ? (
                          <span className="shrink-0 text-[10px] text-stone-400">
                            Nació {formatDateTime(pet.birthDate).split(" · ")[0]}
                          </span>
                        ) : null}
                      </div>
                    ))}

                    {owner.pets.length === 0 ? (
                      <p className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-400">
                        <PawPrint className="size-4" />
                        Sin mascotas registradas todavía.
                      </p>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
