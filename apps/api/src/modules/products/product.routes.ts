import { Router } from "express";
import {
  getProductBySlug,
  listProducts,
} from "./product.service";
import { listProductsQuerySchema } from "./product.schema";

const router = Router();

/** GET /api/products — catálogo público con filtros. */
router.get("/", async (req, res) => {
  const query = listProductsQuerySchema.parse(req.query);
  res.json({ products: await listProducts(query) });
});

/** GET /api/products/:slug — detalle de un producto. */
router.get("/:slug", async (req, res) => {
  res.json({ product: await getProductBySlug(req.params.slug) });
});

export default router;
