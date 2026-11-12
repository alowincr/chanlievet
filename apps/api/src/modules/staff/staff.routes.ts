import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { listPublicVeterinarians, listVeterinarians } from "./staff.service";

const router = Router();

/** GET /api/staff/veterinarians/public — equipo visible en la web. */
router.get("/veterinarians/public", async (_req, res) => {
  res.json({ veterinarians: await listPublicVeterinarians() });
});

/** GET /api/staff/veterinarians — veterinarios activos (para asignaciones). */
router.get(
  "/veterinarians",
  requireAuth,
  requireRole("ADMIN", "VETERINARIAN"),
  async (_req, res) => {
    res.json({ veterinarians: await listVeterinarians() });
  },
);

export default router;
