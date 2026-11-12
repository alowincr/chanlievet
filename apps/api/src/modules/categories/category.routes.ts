import { Router } from "express";
import { listCategories } from "./category.service";

const router = Router();

/** GET /api/categories — categorías de la tienda con conteo de productos. */
router.get("/", async (_req, res) => {
  res.json({ categories: await listCategories() });
});

export default router;
