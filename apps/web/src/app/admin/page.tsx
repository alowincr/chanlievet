"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  CircleCheck,
  Clock,
  Package,
  PawPrint,
  Radio,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import { PetAvatar } from "@/components/placeholders";
import { QueueBoard } from "@/components/queue-board";
import { StatusBadge } from "@/components/status-badge";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { getSocket, SOCKET_EVENTS } from "@/lib/socket";
import {
  formatCurrency,
  formatDateTime,
  formatRelative,
  formatTime,
} from "@/lib/format";
import type { AdminStats } from "@/lib/types";

export default function AdminDashboardPage() {
  const { data, loading, error, refetch } = useApiQuery<{
    stats: AdminStats;
  }>("/api/admin/stats");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const handler = () => refetch();
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    // Cualquier cambio de estado mueve la cola y el historial de actividad.
    socket.on(SOCKET_EVENTS.APPOINTMENT_UPDATED, handler);
    socket.on(SOCKET_EVENTS.QUEUE_UPDATED, handler);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    setConnected(socket.connected);

    return () => {
      socket.off(SOCKET_EVENTS.APPOINTMENT_UPDATED, handler);
      socket.off(SOCKET_EVENTS.QUEUE_UPDATED, handler);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [refetch]);

  if (loading) return <LoadingBlock label="Cargando métricas de la clínica..." />;

  if (error || !data) {
    return (
      <Alert variant="error" title="No pudimos cargar el resumen">
        <p>{error ?? "Intenta nuevamente en unos segundos."}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={refetch}>
          <RefreshCw className="size-4" />
          Reintentar
        </Button>
      </Alert>
    );
  }

  const stats = data.stats;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900">
            Resumen de hoy
          </h2>
          <p className="text-sm text-stone-500">
            Supervisa la operación de la clínica en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
          <ButtonLink href="/admin/citas" size="sm">
            <CalendarDays className="size-4" />
            Ver citas
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Citas hoy"
          value={stats.appointmentsToday}
          hint={`${stats.pending} pendientes de confirmar`}
          icon={<CalendarDays className="size-5" />}
        />
        <StatCard
          label="En espera"
          value={stats.waiting}
          hint="Sala de espera virtual"
          icon={<Clock className="size-5" />}
          tone="amber"
        />
        <StatCard
          label="En atención"
          value={stats.inProgress}
          hint="Consultas en curso"
          icon={<Activity className="size-5" />}
          tone="violet"
        />
        <StatCard
          label="Finalizadas hoy"
          value={stats.completedToday}
          hint={`${stats.cancelledToday} canceladas`}
          icon={<CircleCheck className="size-5" />}
          tone="emerald"
        />
        <StatCard
          label="Stock bajo"
          value={stats.lowStockCount}
          hint="Productos por reponer"
          icon={<TriangleAlert className="size-5" />}
          tone="rose"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Radio className="size-4 text-brand-600" />
                Sala en vivo
              </span>
            }
            description="Lo que ve el equipo y la pantalla pública, actualizado al instante."
            action={
              <ButtonLink href="/admin/citas" size="sm" variant="outline">
                Gestionar citas
              </ButtonLink>
            }
          />
          <div className="p-4">
            <QueueBoard
              snapshot={stats.liveQueue}
              connected={connected}
              error={null}
              staffView
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Activity className="size-4 text-violet-600" />
                Actividad reciente
              </span>
            }
            description="Quién inició o finalizó una atención, en tiempo real."
          />
          <div className="p-4">
            {stats.activity.length === 0 ? (
              <EmptyState
                icon={<Activity className="size-5" />}
                title="Sin movimientos todavía"
                description="Las llegadas, atenciones y cierres de hoy aparecerán aquí."
              />
            ) : (
              <ol className="space-y-3">
                {stats.activity.map((event) => (
                  <li key={event.id} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-500">
                      {event.status === "IN_PROGRESS" ? (
                        <Activity className="size-4 text-violet-600" />
                      ) : event.status === "COMPLETED" ? (
                        <CircleCheck className="size-4 text-emerald-600" />
                      ) : event.status === "WAITING" ? (
                        <Clock className="size-4 text-amber-600" />
                      ) : (
                        <CalendarDays className="size-4 text-sky-600" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-stone-800">
                        <span className="font-semibold">{event.petName}</span>{" "}
                        <span className="text-stone-500">· {event.label}</span>
                      </p>
                      <p className="truncate text-[11px] text-stone-400">
                        {event.ownerName} · {event.serviceName}
                        {event.vetName ? ` · ${event.vetName}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-stone-400">
                      {formatRelative(event.at)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Próximas citas"
            description="Las citas más relevantes de la agenda."
            action={
              <Link
                href="/admin/citas"
                className="text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Ver todas
              </Link>
            }
          />
          <div className="p-2">
            {stats.upcoming.length === 0 ? (
              <div className="p-3">
                <EmptyState
                  icon={<CalendarDays className="size-6" />}
                  title="No hay citas próximas"
                  description="Las nuevas reservas aparecerán aquí automáticamente."
                />
              </div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {stats.upcoming.slice(0, 6).map((appointment) => (
                  <li
                    key={appointment.id}
                    className="flex flex-wrap items-center gap-3 px-3 py-3"
                  >
                    <PetAvatar
                      name={appointment.pet.name}
                      species={appointment.pet.species}
                      photoUrl={appointment.pet.photoUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-stone-900">
                          {appointment.pet.name}
                        </p>
                        <span className="font-mono text-[10px] text-stone-400">
                          {appointment.code}
                        </span>
                      </div>
                      <p className="truncate text-xs text-stone-500">
                        {appointment.owner.fullName} · {appointment.service.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-stone-700">
                        {formatDateTime(appointment.scheduledAt)}
                      </p>
                      <div className="mt-1">
                        <StatusBadge status={appointment.status} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Comunidad" description="Datos acumulados." />
            <div className="grid grid-cols-2 gap-3 p-4">
              {[
                { label: "Dueños", value: stats.totals.owners, icon: Users },
                { label: "Mascotas", value: stats.totals.pets, icon: PawPrint },
                { label: "Productos", value: stats.totals.products, icon: Package },
                {
                  label: "Citas",
                  value: stats.totals.appointments,
                  icon: CalendarDays,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-stone-100 bg-stone-50/70 p-3"
                  >
                    <Icon className="size-4 text-brand-600" />
                    <p className="mt-1.5 text-xl font-bold tabular-nums text-stone-900">
                      {item.value}
                    </p>
                    <p className="text-[11px] text-stone-500">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Stock crítico"
              description="Productos en o por debajo del mínimo."
              action={
                <Link
                  href="/admin/productos"
                  className="text-xs font-semibold text-brand-700"
                >
                  Gestionar
                </Link>
              }
            />
            <div className="p-4">
              {stats.lowStockProducts.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                  <Sparkles className="size-4" />
                  Todo el inventario está en orden.
                </div>
              ) : (
                <ul className="space-y-2">
                  {stats.lowStockProducts.slice(0, 6).map((product) => (
                    <li
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-stone-800">
                          {product.name}
                        </p>
                        <p className="truncate text-[11px] text-stone-400">
                          {product.category}
                        </p>
                      </div>
                      <Badge tone={product.stock === 0 ? "rose" : "amber"}>
                        {product.stock} u.
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Agenda de referencia"
          description="Hora de atención y precio estimado de las próximas citas."
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-[11px] uppercase tracking-wide text-stone-400">
                <th className="px-4 py-2 font-semibold">Horario</th>
                <th className="px-4 py-2 font-semibold">Mascota</th>
                <th className="px-4 py-2 font-semibold">Servicio</th>
                <th className="px-4 py-2 font-semibold">Estado</th>
                <th className="px-4 py-2 text-right font-semibold">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {stats.upcoming.slice(0, 5).map((appointment) => (
                <tr key={appointment.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-stone-500">
                    {formatTime(appointment.scheduledAt)}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-stone-800">
                    {appointment.pet.name}
                  </td>
                  <td className="px-4 py-2.5 text-stone-600">
                    {appointment.service.name}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={appointment.status} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-stone-800">
                    {formatCurrency(appointment.service.price)}
                  </td>
                </tr>
              ))}
              {stats.upcoming.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-stone-500">
                    Sin citas registradas por ahora.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
