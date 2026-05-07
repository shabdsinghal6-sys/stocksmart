import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, movementsTable, productsTable } from "@workspace/db";
import {
  ListMovementsQueryParams,
  ListMovementsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/movements", async (req, res): Promise<void> => {
  const parsed = ListMovementsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { productId, type, limit } = parsed.data;

  const conditions = [];
  if (productId) {
    conditions.push(eq(movementsTable.productId, productId));
  }
  if (type) {
    conditions.push(eq(movementsTable.type, type));
  }

  const rows = await db
    .select({
      id: movementsTable.id,
      productId: movementsTable.productId,
      productName: productsTable.name,
      type: movementsTable.type,
      quantity: movementsTable.quantity,
      quantityBefore: movementsTable.quantityBefore,
      quantityAfter: movementsTable.quantityAfter,
      note: movementsTable.note,
      createdAt: movementsTable.createdAt,
    })
    .from(movementsTable)
    .innerJoin(productsTable, eq(movementsTable.productId, productsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(movementsTable.createdAt))
    .limit(limit);

  const result = rows.map(r => ({
    ...r,
    quantity: Number(r.quantity),
    quantityBefore: Number(r.quantityBefore),
    quantityAfter: Number(r.quantityAfter),
    createdAt: r.createdAt.toISOString(),
  }));

  res.json(ListMovementsResponse.parse(result));
});

export default router;
