import { Router, type IRouter } from "express";
import { eq, and, lte, sql, ilike, asc } from "drizzle-orm";
import { db, productsTable, movementsTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  CreateProductBody,
  GetProductParams,
  GetProductResponse,
  UpdateProductParams,
  UpdateProductBody,
  UpdateProductResponse,
  DeleteProductParams,
  AdjustStockParams,
  AdjustStockBody,
  AdjustStockResponse,
  ListProductsResponseItem,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { category, lowStock, search } = parsed.data;

  const conditions = [];

  if (category) {
    conditions.push(eq(productsTable.category, category));
  }

  if (search) {
    conditions.push(ilike(productsTable.name, `%${search}%`));
  }

  let query = db.select().from(productsTable);

  const rows = conditions.length > 0
    ? await query.where(and(...conditions)).orderBy(asc(productsTable.name))
    : await query.orderBy(asc(productsTable.name));

  let result = rows.map(r => ({
    ...r,
    quantity: Number(r.quantity),
    minThreshold: Number(r.minThreshold),
    costPrice: r.costPrice != null ? Number(r.costPrice) : null,
    sellingPrice: r.sellingPrice != null ? Number(r.sellingPrice) : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  if (lowStock === true) {
    result = result.filter(p => p.quantity <= p.minThreshold);
  }

  res.json(result);
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, category, unit, quantity, minThreshold, costPrice, sellingPrice, description } = parsed.data;

  const [product] = await db.insert(productsTable).values({
    name,
    category,
    unit,
    quantity: String(quantity),
    minThreshold: String(minThreshold),
    costPrice: costPrice != null ? String(costPrice) : null,
    sellingPrice: sellingPrice != null ? String(sellingPrice) : null,
    description: description ?? null,
  }).returning();

  // Record initial stock movement if quantity > 0
  if (quantity > 0) {
    await db.insert(movementsTable).values({
      productId: product.id,
      type: "in",
      quantity: String(quantity),
      quantityBefore: "0",
      quantityAfter: String(quantity),
      note: "Initial stock",
    });
  }

  res.status(201).json(GetProductResponse.parse({
    ...product,
    quantity: Number(product.quantity),
    minThreshold: Number(product.minThreshold),
    costPrice: product.costPrice != null ? Number(product.costPrice) : null,
    sellingPrice: product.sellingPrice != null ? Number(product.sellingPrice) : null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse({
    ...product,
    quantity: Number(product.quantity),
    minThreshold: Number(product.minThreshold),
    costPrice: product.costPrice != null ? Number(product.costPrice) : null,
    sellingPrice: product.sellingPrice != null ? Number(product.sellingPrice) : null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));
});

router.put("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, category, unit, quantity, minThreshold, costPrice, sellingPrice, description } = parsed.data;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (category !== undefined) updateData.category = category;
  if (unit !== undefined) updateData.unit = unit;
  if (quantity !== undefined) updateData.quantity = String(quantity);
  if (minThreshold !== undefined) updateData.minThreshold = String(minThreshold);
  if (costPrice !== undefined) updateData.costPrice = costPrice != null ? String(costPrice) : null;
  if (sellingPrice !== undefined) updateData.sellingPrice = sellingPrice != null ? String(sellingPrice) : null;
  if (description !== undefined) updateData.description = description ?? null;

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(UpdateProductResponse.parse({
    ...product,
    quantity: Number(product.quantity),
    minThreshold: Number(product.minThreshold),
    costPrice: product.costPrice != null ? Number(product.costPrice) : null,
    sellingPrice: product.sellingPrice != null ? Number(product.sellingPrice) : null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.delete(productsTable).where(eq(productsTable.id, params.data.id)).returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/products/:id/adjust", async (req, res): Promise<void> => {
  const params = AdjustStockParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdjustStockBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const currentQty = Number(existing.quantity);
  const adjustQty = parsed.data.quantity;
  let newQty: number;

  if (parsed.data.type === "in") {
    newQty = currentQty + adjustQty;
  } else if (parsed.data.type === "out") {
    newQty = Math.max(0, currentQty - adjustQty);
  } else {
    // adjustment — set to new value
    newQty = adjustQty;
  }

  await db.insert(movementsTable).values({
    productId: params.data.id,
    type: parsed.data.type,
    quantity: String(adjustQty),
    quantityBefore: String(currentQty),
    quantityAfter: String(newQty),
    note: parsed.data.note ?? null,
  });

  const [updated] = await db
    .update(productsTable)
    .set({ quantity: String(newQty) })
    .where(eq(productsTable.id, params.data.id))
    .returning();

  res.json(AdjustStockResponse.parse({
    ...updated,
    quantity: Number(updated.quantity),
    minThreshold: Number(updated.minThreshold),
    costPrice: updated.costPrice != null ? Number(updated.costPrice) : null,
    sellingPrice: updated.sellingPrice != null ? Number(updated.sellingPrice) : null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }));
});

export default router;
