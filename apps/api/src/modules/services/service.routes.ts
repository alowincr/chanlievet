import { Router } from "express";
import { listServices } from "./service.service";

const router = Router();

/** GET /api/services — servicios activos de la clínica. */
router.get("/", async (_req, res) => {
  res.json({ services: await listServices() });
});

export default router;
