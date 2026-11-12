import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { parseId } from "../../utils/params";
import {
  assignVeterinarianSchema,
  availabilityQuerySchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  lookupAppointmentsSchema,
  updateAppointmentStatusSchema,
} from "./appointment.schema";
import {
  assignVeterinarian,
  checkInAppointment,
  createAppointment,
  getAppointmentByCode,
  getAvailability,
  listAppointments,
  lookupAppointments,
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
 * GET /api/appointments/availability?date=YYYY-MM-DD
 * Horarios ya ocupados en un día (Lima) para no ofrecer dobles reservas.
 */
router.get("/availability", async (req, res) => {
  const { date } = availabilityQuerySchema.parse(req.query);
  res.json(await getAvailability(date));
});

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
