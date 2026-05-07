import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import movementsRouter from "./movements";
import dashboardRouter from "./dashboard";
import categoriesRouter from "./categories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(movementsRouter);
router.use(dashboardRouter);
router.use(categoriesRouter);

export default router;
