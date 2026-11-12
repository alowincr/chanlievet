import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getQueueSnapshot } from "./queue.service";

const router = Router();

/**
 * GET /api/queue — snapshot público de la sala de espera.
 * Solo nombres parciales, sin códigos ni datos de contacto.
 */
router.get("/", async (_req, res) => {
  res.json({ queue: await getQueueSnapshot(new Date(), "public") });
});

/**
 * GET /api/queue/staff — snapshot completo para el personal autenticado.
 * Incluye nombres completos, pero tampoco expone celulares ni correos.
 */
router.get("/staff", requireAuth, async (_req, res) => {
  res.json({ queue: await getQueueSnapshot(new Date(), "staff") });
});

export default router;
