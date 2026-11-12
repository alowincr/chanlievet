import { Router } from "express";
import { loginSchema } from "./auth.schema";
import { login } from "./auth.service";
import { validateBody } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { getAuthenticatedUser } from "../staff/staff.service";

const router = Router();

/** POST /api/auth/login — inicio de sesión del personal. */
router.post("/login", validateBody(loginSchema), async (req, res) => {
  const result = await login(req.body);
  res.json(result);
});

/** GET /api/auth/me — datos vigentes del usuario autenticado. */
router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: await getAuthenticatedUser(req.user!.id) });
});

export default router;
