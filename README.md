# ChanlieVet

Plataforma web para una clínica veterinaria ficticia con **una sola sede en San Juan de Lurigancho, Lima**. Incluye tienda con carrito, reserva de citas **sin registro obligatorio**, seguimiento por código, sala de espera virtual en tiempo real y paneles de administración y veterinaria.

> Todos los datos del seed (nombres, teléfonos, correos y credenciales) son ficticios y solo sirven para la demostración.

---

## ✨ Funcionalidades

### Sitio público
- **Inicio** con servicios, carrusel continuo del equipo veterinario, productos destacados y contadores de la sala de espera en vivo.
- **Tienda** con categorías, filtros por público (perro/gato), búsqueda, orden por precio y carrito persistente en `localStorage`.
- **Detalle de producto** con stock real, cantidades y coordinación por WhatsApp.
- **Carrito** con resumen y mensaje de pedido prearmado para WhatsApp (sin pasarela de pago).
- **Agendar cita** sin crear cuenta: dueño (nombre, celular y **DNI de 8 dígitos**), mascota, servicio y fecha/hora. Al confirmar se entrega un código único (`CV-XXXXXX`).
  - Horarios calculados en la zona horaria de Lima y deshabilitados cuando ya están ocupados.
  - **Cupo real por duración**: cada cita ocupa desde su hora de inicio hasta que termina el servicio. Una franja solo se ofrece si queda capacidad (`SLOT_CAPACITY`, por defecto 1). Las reservas del mismo día se serializan con un advisory lock para evitar sobreventa.
  - Confirmación con resumen antes de enviar y recuperación de la cita al recargar (`?codigo=`).
  - Bloqueo de reservas duplicadas (mismo celular + mismo horario) desde el servidor.
  - Recuperación del código perdido con **celular o DNI + nombre de la mascota**.
- **Seguimiento** por código: estado de la cita, posición en la cola, check-in con ventana de 2 horas y actualizaciones por WebSocket.
  - **Cancelar o reprogramar sin llamar**: el cliente confirma su identidad con el celular o DNI usado al reservar y puede mover la cita a otra franja con cupo o cancelarla. La reprogramación vuelve a estado “Registrada” para que recepción la confirme.
- **Emergencias** (`/emergencia`): señales de alarma, teléfonos de contacto y triaje público en menos de un minuto.
  - Gravedad `CRITICAL` / `URGENT` / `MODERATE`, síntomas y datos de la mascota.
  - La cita entra **directamente a la cola como `WAITING` con prioridad `EMERGENCY`**: pasa al frente de la sala de espera y se destaca en rojo en la vista pública, admin y veterinaria.
  - Solo se acepta dentro del horario de atención; fuera de horario se muestra el teléfono y WhatsApp de urgencia.
- **Sala de espera virtual**: solo citas de hoy (calendario de Lima); nombres parciales en la vista pública.
- **Login de personal** con JWT y cuentas demo.

### Panel de administración (`/admin`)
- Métricas del día (citas, en espera, en atención, finalizadas, stock bajo).
- **Sala en vivo** y **actividad reciente** (llegadas, inicios y cierres de atención) actualizadas en tiempo real.
- Agenda de citas con filtros por estado, fecha y búsqueda; cambio de estado y asignación de veterinario.
- **Cancelar** disponible también para citas confirmadas y en espera, además de las registradas.
- Las emergencias se identifican con una etiqueta roja y su nivel de triaje en la agenda.
- Confirmación antes de cancelar, marcar inasistencia o finalizar; restauración de citas canceladas o con inasistencia.
- **Pacientes y dueños** (`/admin/pacientes`): datos de contacto, DNI, mascotas e historial básico de visitas.
- **Personal** (`/admin/personal`): crear y editar usuarios, cambiar roles, asignar especialidad y presentación, restablecer contraseña y desactivar/reactivar cuentas. Se protege la cuenta propia y exige al menos un administrador activo; la baja es lógica para no perder el historial de citas.
- Inventario: crear/editar productos, ajustar stock, activar/ocultar, alertas de stock bajo.
- Imágenes de producto por URL con vista previa en el formulario; si el enlace falla se muestra el marcador de la categoría.
- El slug público se regenera al guardar el nombre, así la dirección `/producto/...` coincide siempre con el catálogo actual.

### Panel veterinario (`/veterinario`)
- Cola de atención en dos columnas (en espera / en atención).
- **Emergencias primero**: la cola ordena por prioridad y luego por llegada; el triaje y los síntomas se muestran solo al personal.
- Botones de flujo: **En espera → En atención → Finalizado**, además de confirmar, ingresar a sala y marcar no asistió.
- Confirmación antes de finalizar una atención o marcar inasistencia.
- Temporizador de la consulta, contacto telefónico y WhatsApp.
- **Sala en vivo dentro del panel** (`/veterinario/sala`) con nombres completos para el personal.
- Actualización automática por Socket.io.

---

## 🧱 Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, lucide-react |
| Backend | Node.js, Express 5, TypeScript, Socket.io |
| Base de datos | PostgreSQL 16 + Prisma ORM 7 (`@prisma/adapter-pg`) |
| Autenticación | JWT (`jsonwebtoken`) + hashing scrypt (`node:crypto`) |
| Contenedores | Docker + Docker Compose |

---

## 📁 Estructura

```text
ChanlieVet/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Modelo de datos
│   │   │   ├── migrations/            # Migración inicial
│   │   │   └── seed.ts                # Datos de demostración
│   │   ├── src/
│   │   │   ├── config/                # Validación de variables de entorno
│   │   │   ├── lib/                   # Prisma, JWT, password, logger
│   │   │   ├── middleware/            # Auth, validación Zod, errores
│   │   │   ├── modules/               # auth, citas, cola, productos, admin...
│   │   │   ├── realtime/              # Socket.io y contrato de eventos
│   │   │   ├── app.ts                 # Express app
│   │   │   └── index.ts               # HTTP + WebSocket bootstrap
│   │   ├── prisma7.config.ts          # Configuración Prisma 7 (URL, seed)
│   │   └── Dockerfile
│   └── web/
│       ├── src/app/
│       │   ├── (site)/                # Inicio, tienda, citas, seguimiento...
│       │   ├── admin/                 # Panel de administración
│       │   └── veterinario/           # Panel veterinario
│       ├── src/components/            # UI kit, header/footer, tarjetas...
│       ├── src/lib/                   # API client, socket, hooks, tipos
│       └── Dockerfile
├── docker-compose.yml                 # db + api + web
├── .env.example
└── package.json                       # Scripts helper del monorepo
```

---

## 🚀 Inicio rápido con Docker

Requisitos: **Docker** con Compose.

```bash
# 1. Crea tu .env local (no se sube al repositorio)
cp .env.example .env

# 2. Define un JWT_SECRET real (Docker Compose no arranca sin él)
openssl rand -hex 32
# Copia el resultado en JWT_SECRET= dentro de .env

# 3. Levanta todo
docker compose up --build
```

Servicios:

| Servicio | URL |
| --- | --- |
| Web | http://localhost:3000 |
| API | http://localhost:4000/api/health |
| PostgreSQL | `localhost:5433` (usuario/clave/db: `chanlievet`) |

Al iniciar, el contenedor del API:
1. Aplica las migraciones (`prisma migrate deploy`).
2. Ejecuta el seed si la base está vacía (idempotente).
3. Levanta Express + Socket.io en el puerto `4000`.

> El puerto **5433** en el host evita chocar con un PostgreSQL local que ya use 5432.

Detener:

```bash
npm run docker:down
# Borrar también los datos:
npm run docker:reset
```

---

## 💻 Desarrollo local

Requisitos: **Node.js 22+**, npm y PostgreSQL (local o el contenedor `db`).

```bash
# 1. Instalar dependencias de ambas apps
npm run install:all

# 2. Variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Base de datos (opción con Docker, puerto host 5433)
npm run db:up
# Edita apps/api/.env:
# DATABASE_URL="postgresql://chanlievet:chanlievet@localhost:5433/chanlievet?schema=public"

# 4. Migrar y sembrar
npm run db:deploy
npm run db:seed
# Alternativa en desarrollo (crea migraciones nuevas):
# npm run db:migrate

# 5. Levantar API y web en terminales separadas
npm run dev:api
npm run dev:web
```

- Web: http://localhost:3000
- API: http://localhost:4000/api

### Variables del API (`apps/api/.env`)

| Variable | Descripción | Default |
| --- | --- | --- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL | — |
| `PORT` | Puerto del API | `4000` |
| `NODE_ENV` | Entorno (`development`/`production`) | `development` |
| `JWT_SECRET` | Secreto de firma (mín. 16 caracteres) | — |
| `JWT_EXPIRES_IN` | Vigencia del token | `12h` |
| `CORS_ORIGIN` | Orígenes permitidos, separados por coma | `http://localhost:3000` |
| `LOW_STOCK_THRESHOLD` | Umbral de stock bajo | `5` |
| `SLOT_CAPACITY` | Citas simultáneas permitidas por franja de 30 min | `1` |

### Variables de la web (`apps/web/.env.local`)

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL pública del API (REST + Socket.io) |

> `NEXT_PUBLIC_API_URL` se incrusta en el bundle al construir. Si cambias la URL del API en Docker, reconstruye la imagen con `--build-arg NEXT_PUBLIC_API_URL=...`.

---

## 🔑 Cuentas de demostración

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administradora | `admin@chanlievet.pe` | `chanlievet123` |
| Veterinario (medicina interna) | `vet@chanlievet.pe` | `chanlievet123` |
| Veterinaria (dermatología) | `lramos@chanlievet.pe` | `chanlievet123` |
| Veterinaria (medicina felina) | `crojas@chanlievet.pe` | `chanlievet123` |
| Veterinario (cirugía) | `dsalazar@chanlievet.pe` | `chanlievet123` |

El seed también crea servicios, 5 categorías, 16 productos, dueños, mascotas y 8 citas en distintos estados. Es idempotente: si la base ya tiene datos, solo completa los perfiles públicos del equipo sin borrar información.

> Si quieres volver a poblar la base desde cero (esto **borra** staff, productos, dueños, mascotas y citas), usa `npm run db:reset`.

---

## 📜 Scripts

Desde la raíz:

| Script | Acción |
| --- | --- |
| `npm run install:all` | Instala dependencias de API y web |
| `npm run dev:api` / `npm run dev:web` | Servidores de desarrollo |
| `npm run build` | Build de producción de ambas apps |
| `npm run db:generate` | Genera Prisma Client |
| `npm run db:migrate` | Crea/aplica migraciones en desarrollo |
| `npm run db:deploy` | Aplica migraciones existentes |
| `npm run db:seed` | Ejecuta el seed de demostración |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:up` | Levanta solo PostgreSQL con Docker |
| `npm run docker:up` / `docker:down` / `docker:reset` | Ciclo de vida de Compose |

---

## 🔌 API (resumen)

Base: `http://localhost:4000/api`

### Públicos

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/health` | Healthcheck |
| `GET` | `/categories` | Categorías con conteo de productos |
| `GET` | `/products` | Catálogo (`category`, `audience`, `search`, `sort`, `limit`) |
| `GET` | `/products/:slug` | Detalle de producto |
| `GET` | `/services` | Servicios activos |
| `GET` | `/staff/veterinarians/public` | Equipo visible en la web (nombre, especialidad, bio) |
| `POST` | `/appointments` | Reserva sin registro → devuelve código |
| `GET` | `/appointments/availability?date=YYYY-MM-DD&serviceId=1` | Franjas con cupo según la duración del servicio |
| `POST` | `/appointments/lookup` | Recupera citas por celular o DNI + mascota |
| `GET` | `/appointments/track/:code` | Seguimiento por código |
| `POST` | `/appointments/track/:code/check-in` | Ingreso a la sala de espera (solo el día de la cita) |
| `POST` | `/appointments/track/:code/cancel` | Cancelación por el cliente (celular o DNI) |
| `POST` | `/appointments/track/:code/reschedule` | Reprogramación con validación de cupo |
| `GET` | `/appointments/emergency/status` | ¿La clínica está abierta ahora? |
| `POST` | `/appointments/emergency` | Triaje público → cita prioritaria en la cola |
| `GET` | `/queue` | Snapshot público de la cola (nombres parciales, sin contactos ni códigos) |

### Staff autenticado (JWT)

| Método | Ruta | Roles |
| --- | --- | --- |
| `POST` | `/auth/login` | público |
| `GET` | `/auth/me` | staff |
| `GET` | `/appointments` | admin, veterinario |
| `PATCH` | `/appointments/:id/status` | admin, veterinario |
| `PATCH` | `/appointments/:id/vet` | admin |
| `GET` | `/staff/veterinarians` | admin, veterinario |
| `GET` | `/queue/staff` | admin, veterinario (nombres completos) |
| `GET` | `/admin/stats` | admin |
| `GET` | `/admin/patients` | admin |
| `GET`/`POST` | `/admin/products` | admin |
| `PATCH` | `/admin/products/:id` | admin |
| `PATCH` | `/admin/products/:id/stock` | admin |
| `GET`/`POST` | `/admin/staff` | admin |
| `PATCH` | `/admin/staff/:id` | admin |
| `DELETE` | `/admin/staff/:id` | admin (baja lógica) |

Errores: `{ "error": "mensaje", "details"?: [...] }` con códigos HTTP 400/401/404/409/500. Las validaciones usan Zod.

---

## 🔄 WebSocket (Socket.io)

Misma URL del API (`http://localhost:4000`).

| Dirección | Evento | Payload |
| --- | --- | --- |
| Cliente → servidor | `queue:watch` | — |
| Cliente → servidor | `queue:unwatch` | — |
| Cliente → servidor | `appointment:watch` | `code` |
| Cliente → servidor | `appointment:unwatch` | `code` |
| Servidor → cliente | `queue:updated` | Snapshot público de la cola (nombres parciales, sin contactos ni códigos) |
| Servidor → cliente | `appointment:updated` | `{ code, status, queuePosition, updatedAt }` |

Salas:
- `queue`: pública, pantallas de sala de espera.
- `appointment:<CODE>`: seguimiento individual de una cita.

El snapshot de cola se recalcula y emite en cada cambio relevante (check-in, inicio/fin de atención, asignación de veterinario). Los paneles del personal escuchan el evento y vuelven a consultar `/api/queue/staff` para obtener los nombres completos; así los datos personales no viajan por el canal público.

---

## 🗃️ Modelo de datos

- **StaffUser** — personal con rol `ADMIN` o `VETERINARIAN`, especialidad y presentación pública.
- **Owner** — dueño identificado por teléfono (se reutiliza en nuevas reservas).
- **Pet** — mascota del dueño; se reutiliza por nombre.
- **Service** — servicios de la clínica con precio y duración.
- **Appointment** — cita con código único, estado, prioridad (`NORMAL` / `EMERGENCY`), triaje (`triageSeverity`, `triageSymptoms`), timestamps y veterinario asignado.
- **Category / Product** — catálogo con stock, público objetivo y visibilidad.

Flujo de estados:

```text
PENDING → CONFIRMED → WAITING → IN_PROGRESS → COMPLETED
                 ↘ CANCELLED / NO_SHOW
CANCELLED / NO_SHOW → CONFIRMED   (restauración por el admin)
```

La cola se **deriva** de las citas (`WAITING` / `IN_PROGRESS`) y se filtra por el día calendario de Lima. El orden es prioridad (`EMERGENCY` primero) y luego `checkedInAt` / `id`; la posición del cliente usa ese mismo orden.

La agenda se controla por intervalos: cada cita ocupa `[scheduledAt, scheduledAt + service.durationMin)` y el sistema rechaza con `409` cualquier reserva que supere `SLOT_CAPACITY` en esa franja.

---

## 🔐 Seguridad y privacidad

- **Una sola sede**: toda la información y los enlaces corresponden a San Juan de Lurigancho. No se ofrecen otras ubicaciones.
- La sala pública solo muestra el **nombre de la mascota**, el **primer nombre + inicial** del dueño, el servicio y los tiempos. No expone celulares, correos, documentos ni códigos de seguimiento.
- El snapshot de Socket.io es público y va anonimizado; los nombres completos se consultan con JWT en `/api/queue/staff`.
- La recuperación de citas exige el **nombre de la mascota** y al menos un dato del dueño (**celular o DNI**) y devuelve solo las citas de esa combinación.
- El check-in solo se permite el **día de la cita** (calendario de Lima) y desde 2 horas antes.
- El servidor rechaza reservas duplicadas con el mismo celular y el mismo horario, incluso si se recarga la página. Un **advisory lock de PostgreSQL** serializa dos peticiones simultáneas, de modo que solo una reserva se crea (la otra recibe `409`).
- `.env`, `.env.local`, builds, logs y el cliente Prisma generado están en `.gitignore`. El repositorio solo incluye `.env.example` con valores de demostración.
- Los nombres, teléfonos, DNI, correos y contraseñas del seed son ficticios. Cambia `JWT_SECRET` y las credenciales demo antes de un despliegue real.

---

## 📝 Notas de diseño

- **Sin cuentas de cliente**: el teléfono identifica al dueño y el código de cita permite el seguimiento.
- **Carrito local**: se guarda en `localStorage`; el checkout se coordina por WhatsApp y el stock se confirma al atender el pedido.
- **Imágenes como placeholders**: el seed deja `imageUrl`, `photoUrl` y `avatarUrl` en `null` a propósito para mostrar los componentes de marcador.
- **Identidad visual**: fondo crema editorial, verde bosque profundo y acentos coral; tipografías Bricolage Grotesque (títulos) e Instrument Sans (texto).
- **Prisma 7**: la URL del CLI vive en `prisma7.config.ts` y el runtime usa `@prisma/adapter-pg`.
- **JWT en localStorage** por simplicidad de demo; en producción se recomienda cookie `HttpOnly` + refresh tokens y cambiar `JWT_SECRET`.

---

## 🧪 Verificación

```bash
npm --prefix apps/api run typecheck
npm --prefix apps/web run typecheck
npm run build
```

Ambas apps compilan con TypeScript estricto y Next.js genera el build standalone usado por Docker.

Además se ejecutaron pruebas funcionales contra el API local:

- **Reserva y privacidad (17/17)**: creación, bloqueo de duplicado, seguimiento por código, recuperación del código perdido, check-in del día, anonimización en la sala pública (`Prueba A.`, sin código ni contactos) y nombres completos en `/api/queue/staff`.
- **DNI y gestión de personal (17/17)**: DNI obligatorio de 8 dígitos, recuperación por celular o DNI + mascota, listado/creación/edición de usuarios, correo duplicado bloqueado, baja lógica y reactivación, bloqueo de acceso para cuentas inactivas, y protección de la cuenta propia (no puede desactivarse ni quitarse el rol de administrador).
- **Concurrencia**: dos `POST /api/appointments` simultáneos con el mismo celular y horario → `201` + `409`.
- **Restauración**: cancelar una cita y volver a `CONFIRMED` desde el panel admin; la cita deja de aparecer en la cola.
- **Auditoría de UI** en escritorio (1440 px) y móvil (390 px): 0 desbordes horizontales, 0 errores de consola, tipografías y paleta correctas; el carrusel del equipo tiene un salto de costura de **0 px**, botón de pausa/reanudar y respeta `prefers-reduced-motion`.

> Docker Compose no se pudo ejecutar en el entorno de desarrollo usado (CLI no disponible). Los `Dockerfile` y `docker-compose.yml` quedan incluidos para levantarlo en una máquina con Docker.
