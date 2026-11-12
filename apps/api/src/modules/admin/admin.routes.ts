import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { parseId } from "../../utils/params";
import { getAdminStats, listPatients } from "./admin.service";
import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
  updateStockSchema,
} from "../products/product.schema";
import {
  adjustProductStock,
  createProduct,
  listProducts,
  updateProduct,
} from "../products/product.service";

const router = Router();

// Todo el panel de administración requiere rol ADMIN.
router.use(requireAuth, requireRole("ADMIN"));

/** GET /api/admin/stats — métricas generales del dashboard. */
router.get("/stats", async (_req, res) => {
  res.json({ stats: await getAdminStats() });
});

const listPatientsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * GET /api/admin/patients — directorio de dueños con sus mascotas.
 * Ahí también se consultan los datos de contacto y el historial de visitas.
 */
router.get("/patients", async (req, res) => {
  const query = listPatientsQuerySchema.parse(req.query);
  res.json(await listPatients(query));
});

/** GET /api/admin/products — catálogo completo (incluye inactivos). */
router.get("/products", async (req, res) => {
  const query = listProductsQuerySchema.parse(req.query);
  res.json({ products: await listProducts(query, true) });
});

/** POST /api/admin/products — crea un producto. */
router.post("/products", validateBody(createProductSchema), async (req, res) => {
  const product = await createProduct(req.body);
  res.status(201).json({ product });
});

/** PATCH /api/admin/products/:id — edita datos del producto. */
router.patch(
  "/products/:id",
  validateBody(updateProductSchema),
  async (req, res) => {
    const id = parseId(req.params.id, "ID de producto");
    const product = await updateProduct(id, req.body);
    res.json({ product });
  },
);

/** PATCH /api/admin/products/:id/stock — control de stock (delta o valor absoluto). */
router.patch(
  "/products/:id/stock",
  validateBody(updateStockSchema),
  async (req, res) => {
    const id = parseId(req.params.id, "ID de producto");
    const product = await adjustProductStock(id, req.body);
    res.json({ product });
  },
);

export default router;
