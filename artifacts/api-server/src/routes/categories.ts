import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { ListCategoriesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .selectDistinct({ category: productsTable.category })
    .from(productsTable)
    .orderBy(productsTable.category);

  const categories = rows.map(r => r.category);
  res.json(ListCategoriesResponse.parse(categories));
});

export default router;
