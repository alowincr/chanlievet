import { Router } from "express";
import { isClinicOpenAt } from "../../lib/schedule";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { parseId } from "../../utils/params";
import {
  appointmentActionAuthSchema,
  assignVeterinarianSchema,
  availabilityQuerySchema,
  createAppointmentSchema,
  createEmergencySchema,
  listAppointmentsQuerySchema,
  lookupAppointmentsSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
} from "./appointment.schema";
import {
  assignVeterinarian,
  cancelAppointmentByCode,
  checkInAppointment,
  createAppointment,
  createEmergencyAppointment,
  getAppointmentByCode,
  getAvailability,
  listAppointments,
  lookupAppointments,
  rescheduleAppointmentByCode,
  updateAppointmentStatus,
} from "./appointment.service";

const router = Router();

/**
 * POST /api/appointments — reserva pública (sin registro).
 * Devuelve el código de seguimiento de la cita.
 */
router.post("/", validateBody(createAppointmentSchema), async (req, res) => {
  const appointment = await createAppointment(req.body);
  res.status(201).json({ appointment });
});

/**
 * GET /api/appointments/availability?date=YYYY-MM-DD&serviceId=1
 * Franjas con cupo para un día (Lima). La duración del servicio define
 * hasta qué hora puede empezar la cita.
 */
router.get("/availability", async (req, res) => {
  const { date, serviceId } = availabilityQuerySchema.parse(req.query);
  res.json(await getAvailability(date, serviceId));
});

/** GET /api/appointments/emergency/status — ¿la clínica está abierta ahora? */
router.get("/emergency/status", (_req, res) => {
  const open = isClinicOpenAt();
  res.json({
    open,
    message: open
      ? "La clínica está abierta. Registra el triaje y pasaremos al frente de la cola."
      : "La clínica está cerrada. Llámanos para recibir orientación inmediata.",
  });
});

/** POST /api/appointments/emergency — triaje público prioritario. */
router.post(
  "/emergency",
  validateBody(createEmergencySchema),
  async (req, res) => {
    const appointment = await createEmergencyAppointment(req.body);
    res.status(201).json({ appointment });
  },
);

/**
 * POST /api/appointments/lookup — recupera el código con celular + mascota.
 * Pensado para quien perdió el código de seguimiento.
 */
router.post("/lookup", validateBody(lookupAppointmentsSchema), async (req, res) => {
  res.json({ appointments: await lookupAppointments(req.body) });
});

/** GET /api/appointments/track/:code — seguimiento público por código. */
router.get("/track/:code", async (req, res) => {
  res.json({ appointment: await getAppointmentByCode(req.params.code) });
});

/** POST /api/appointments/track/:code/check-in — ingreso a la sala de espera. */
router.post("/track/:code/check-in", async (req, res) => {
  res.json({ appointment: await checkInAppointment(req.params.code) });
});

/**
 * POST /api/appointments/track/:code/cancel — el cliente cancela su cita.
 * Exige el celular o el DNI usado al reservar.
 */
router.post(
  "/track/:code/cancel",
  validateBody(appointmentActionAuthSchema),
  async (req, res) => {
    const appointment = await cancelAppointmentByCode(
      String(req.params.code),
      req.body,
    );
    res.json({ appointment });
  },
);

/**
 * POST /api/appointments/track/:code/reschedule — el cliente mueve su cita.
 * Valida el nuevo cupo con la duración real del servicio.
 */
router.post(
  "/track/:code/reschedule",
  validateBody(rescheduleAppointmentSchema),
  async (req, res) => {
    const appointment = await rescheduleAppointmentByCode(
      String(req.params.code),
      req.body,
    );
    res.json({ appointment });
  },
);

/** GET /api/appointments — listado para el panel de staff. */
router.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "VETERINARIAN"),
  async (req, res) => {
    const query = listAppointmentsQuerySchema.parse(req.query);
    res.json({ appointments: await listAppointments(query) });
  },
);

/** PATCH /api/appointments/:id/status — cambia el estado de atención. */
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "VETERINARIAN"),
  validateBody(updateAppointmentStatusSchema),
  async (req, res) => {
    const id = parseId(req.params.id, "ID de cita");
    const appointment = await updateAppointmentStatus(id, req.body, req.user!);
    res.json({ appointment });
  },
);

/** PATCH /api/appointments/:id/vet — asigna un veterinario (solo admin). */
router.patch(
  "/:id/vet",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(assignVeterinarianSchema),
  async (req, res) => {
    const id = parseId(req.params.id, "ID de cita");
    const appointment = await assignVeterinarian(id, req.body.vetId);
    res.json({ appointment });
  },
);

export default router;
