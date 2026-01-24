import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventories, inventoryItems, users, medications, stock } from "@/lib/db/schema";
import { eq, sql, desc, and, gte, lte } from "drizzle-orm";
import { recordBulkStockMovements } from "@/lib/services/stock-service";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let query: any = db

      .select({
        id: inventories.id,
        status: inventories.status,
        inventoryDate: inventories.inventoryDate,
        username: users.username,
        item: {
          id: inventoryItems.id,
          medicationId: inventoryItems.medicationId,
          medicationName: medications.name,
          expectedQuantity: inventoryItems.expectedQuantity,
          countedQuantity: inventoryItems.countedQuantity,
          difference: inventoryItems.difference,
        },
      })
      .from(inventories)
      .leftJoin(users, eq(inventories.userId, users.id))
      .leftJoin(inventoryItems, eq(inventories.id, inventoryItems.inventoryId))
      .leftJoin(medications, eq(inventoryItems.medicationId, medications.id))
      .orderBy(desc(inventories.inventoryDate))
      .limit(limit)
      .offset(offset);

    const conditions = [];
    if (startDate) conditions.push(gte(inventories.inventoryDate, new Date(startDate)));
    if (endDate) conditions.push(lte(inventories.inventoryDate, new Date(endDate)));
    if (userId && userId !== "all") conditions.push(eq(inventories.userId, parseInt(userId)));
    if (status && status !== "all") conditions.push(eq(inventories.status, status));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Fix count query with alias
    let countQuery: any = db
      .select({ count: sql<number>`count(*)`.as('count') })

      .from(inventories);

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [rawInventories, totalResult] = await Promise.all([query, countQuery]);

    const totalCount = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Group inventory items
    const inventoriesMap = new Map();
    for (const row of rawInventories) {
      const inventoryId = row.id;
      if (!inventoriesMap.has(inventoryId)) {
        inventoriesMap.set(inventoryId, {
          id: row.id,
          status: row.status,
          inventoryDate: row.inventoryDate,
          username: row.username,
          items: [],
        });
      }
      if (row.item.id) {
        inventoriesMap.get(inventoryId).items.push({
          id: row.item.id,
          medicationId: row.item.medicationId,
          medicationName: row.item.medicationName,
          expectedQuantity: row.item.expectedQuantity,
          countedQuantity: row.item.countedQuantity,
          difference: row.item.difference,
        });
      }
    }

    const groupedInventories = Array.from(inventoriesMap.values());

    return NextResponse.json({
      inventories: groupedInventories,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("[05:04 PM CAT, 2025-10-20] GET /api/inventories error:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: "Failed to fetch inventories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
    console.log("[05:04 PM CAT, 2025-10-20] POST /api/inventories request body:", body);

    const { userId, items } = body;

    // Validate inputs
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      console.error("[05:04 PM CAT, 2025-10-20] Invalid input:", { userId, items });
      return NextResponse.json(
        { error: "Invalid input: userId and items array are required" },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await db.select({ id: users.id }).from(users).where(eq(users.id, Number(userId))).limit(1);
    if (!user[0]) {
      console.error("[05:04 PM CAT, 2025-10-20] User not found:", userId);
      return NextResponse.json({ error: `User with ID ${userId} not found` }, { status: 404 });
    }

    // Validate items and medications
    for (const item of items) {
      if (!item.medicationId || item.expectedQuantity == null || item.countedQuantity == null) {
        console.error("[05:04 PM CAT, 2025-10-20] Invalid item:", item);
        return NextResponse.json(
          { error: "Invalid item: medicationId, expectedQuantity, and countedQuantity are required" },
          { status: 400 }
        );
      }
      const medication = await db
        .select({ id: medications.id, name: medications.name })
        .from(medications)
        .where(eq(medications.id, Number(item.medicationId)))
        .limit(1);
      if (!medication[0]) {
        console.error("[05:04 PM CAT, 2025-10-20] Medication not found:", item.medicationId);
        return NextResponse.json(
          { error: `Medication with ID ${item.medicationId} not found` },
          { status: 404 }
        );
      }
      // Validate expectedQuantity against stock
      const stockRecord = await db
        .select({ currentQuantity: stock.currentQuantity })
        .from(stock)
        .where(eq(stock.medicationId, Number(item.medicationId)))
        .limit(1);
      if (!stockRecord[0]) {
        console.error("[05:04 PM CAT, 2025-10-20] Stock record not found for medication:", item.medicationId);
        return NextResponse.json(
          { error: `Stock record for medication ${item.medicationId} not found` },
          { status: 404 }
        );
      }
      if (stockRecord[0].currentQuantity !== Number(item.expectedQuantity)) {
        console.error("[05:04 PM CAT, 2025-10-20] Invalid expectedQuantity:", item);
        return NextResponse.json(
          { error: `Expected quantity ${item.expectedQuantity} for medication ${item.medicationId} does not match current stock ${stockRecord[0].currentQuantity}` },
          { status: 400 }
        );
      }
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create inventory
      const newInventory = await tx
        .insert(inventories)
        .values({
          userId: Number(userId),
          status: "completed",
          inventoryDate: new Date(),
        })
        .returning();

      // Create inventory items
      const inventoryItemsData = items.map((item: any) => ({
        inventoryId: newInventory[0].id,
        medicationId: Number(item.medicationId),
        expectedQuantity: Number(item.expectedQuantity),
        countedQuantity: Number(item.countedQuantity),
        difference: Number(item.countedQuantity) - Number(item.expectedQuantity),
      }));

      await tx.insert(inventoryItems).values(inventoryItemsData);

      // Update stock table
      for (const item of items) {
        await tx
          .update(stock)
          .set({ currentQuantity: Number(item.countedQuantity), lastUpdated: new Date() })
          .where(eq(stock.medicationId, Number(item.medicationId)));
      }

      // Record stock movements for adjustments
      const adjustments = items
        .filter((item: any) => Number(item.countedQuantity) - Number(item.expectedQuantity) !== 0)
        .map((item: any) => ({
          medicationId: Number(item.medicationId),
          type: "adjustment" as const,
          quantity: Number(item.countedQuantity) - Number(item.expectedQuantity),
          referenceId: newInventory[0].id,
          referenceType: "inventory" as const,
          reason: "Inventory adjustment",
        }));

      if (adjustments.length > 0) {
        await recordBulkStockMovements(adjustments, tx);
      }


      return {
        ...newInventory[0],
        items: inventoryItemsData,
      };
    });

    console.log("[05:04 PM CAT, 2025-10-20] Inventory created successfully:", result);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("[05:04 PM CAT, 2025-10-20] POST /api/inventories error:", {
      message: error.message,
      stack: error.stack,
      requestBody: body,
    });
    return NextResponse.json({ error: error.message || "Failed to create inventory" }, { status: 500 });
  }
}