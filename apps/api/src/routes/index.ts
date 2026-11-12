import { Router } from "express";
import adminRoutes from "../modules/admin/admin.routes";
import appointmentRoutes from "../modules/appointments/appointment.routes";
import authRoutes from "../modules/auth/auth.routes";
import categoryRoutes from "../modules/categories/category.routes";
import productRoutes from "../modules/products/product.routes";
import queueRoutes from "../modules/queue/queue.routes";
import serviceRoutes from "../modules/services/service.routes";
import staffRoutes from "../modules/staff/staff.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/categories", categoryRoutes);
apiRouter.use("/products", productRoutes);
apiRouter.use("/services", serviceRoutes);
apiRouter.use("/appointments", appointmentRoutes);
apiRouter.use("/queue", queueRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/staff", staffRoutes);
