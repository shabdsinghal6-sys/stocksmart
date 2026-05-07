import { Router, type IRouter } from "express";
import { eq, lte, sql, desc } from "drizzle-orm";
import { db, productsTable, movementsTable } from "@workspace/db";
import { GetDashboardResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard", async (_req, res): Promise<void> => {
  // Total products
  const [{ count: totalProducts }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable);

  // Low stock products (quantity <= minThreshold and quantity > 0)
  const [{ count: lowStockCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(sql`${productsTable.quantity}::numeric <= ${productsTable.minThreshold}::numeric AND ${productsTable.quantity}::numeric > 0`);

  // Out of stock products (quantity = 0)
  const [{ count: outOfStockCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(sql`${productsTable.quantity}::numeric = 0`);

  // Total distinct categories
  const [{ count: totalCategories }] = await db
    .select({ count: sql<number>`count(distinct ${productsTable.category})::int` })
    .from(productsTable);

  // Recent movements (last 10)
  const recentRows = await db
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
    .orderBy(desc(movementsTable.createdAt))
    .limit(10);

  const recentMovements = recentRows.map(r => ({
    ...r,
    quantity: Number(r.quantity),
    quantityBefore: Number(r.quantityBefore),
    quantityAfter: Number(r.quantityAfter),
    createdAt: r.createdAt.toISOString(),
  }));

  // Category breakdown
  const categoryRows = await db
    .select({
      category: productsTable.category,
      count: sql<number>`count(*)::int`,
      lowStockCount: sql<number>`count(*) filter (where ${productsTable.quantity}::numeric <= ${productsTable.minThreshold}::numeric)::int`,
    })
    .from(productsTable)
    .groupBy(productsTable.category)
    .orderBy(productsTable.category);

  // Top low stock products
  const lowStockRows = await db
    .select()
    .from(productsTable)
    .where(sql`${productsTable.quantity}::numeric <= ${productsTable.minThreshold}::numeric`)
    .orderBy(sql`${productsTable.quantity}::numeric / NULLIF(${productsTable.minThreshold}::numeric, 0) asc`)
    .limit(5);

  const topLowStockProducts = lowStockRows.map(p => ({
    ...p,
    quantity: Number(p.quantity),
    minThreshold: Number(p.minThreshold),
    costPrice: p.costPrice != null ? Number(p.costPrice) : null,
    sellingPrice: p.sellingPrice != null ? Number(p.sellingPrice) : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  res.json(GetDashboardResponse.parse({
    totalProducts,
    lowStockCount,
    outOfStockCount,
    totalCategories,
    recentMovements,
    categoryBreakdown: categoryRows,
    topLowStockProducts,
  }));
});

export default router;
