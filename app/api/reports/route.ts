import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, saleItems, purchases, purchaseItems, losses, stock, inventoryItems, medications, users, inventories } from "@/lib/db/schema";
import { eq, gte, lte, and, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build conditions for filtering
    const salesConditions = [];
    const purchasesConditions = [];
    const lossesConditions = [];
    const inventoryConditions = [];

    if (startDate) {
      salesConditions.push(gte(sales.saleDate, new Date(startDate)));
      purchasesConditions.push(gte(purchases.purchaseDate, new Date(startDate)));
      lossesConditions.push(gte(losses.lossDate, new Date(startDate)));
      inventoryConditions.push(gte(inventoryItems.inventoryId, db.select({ maxId: sql<number>`max(${inventories.id})` }).from(inventories)));
    }
    if (endDate) {
      salesConditions.push(lte(sales.saleDate, new Date(endDate)));
      purchasesConditions.push(lte(purchases.purchaseDate, new Date(endDate)));
      lossesConditions.push(lte(losses.lossDate, new Date(endDate)));
    }
    if (userId && userId !== "all") {
      salesConditions.push(eq(sales.userId, parseInt(userId)));
      lossesConditions.push(eq(losses.userId, parseInt(userId)));
    }

    // Query for medication report data
    const reportQuery = db
      .select({
        medicationId: medications.id,
        medicationCode: medications.code,
        medicationName: medications.name,
        totalSales: sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.unitPrice}), 0)`.as("totalSales"),
        totalPurchases: sql<number>`COALESCE(SUM(${purchaseItems.quantity} * ${purchaseItems.unitPrice}), 0)`.as("totalPurchases"),
        totalLosses: sql<number>`COALESCE(SUM(${losses.value}), 0)`.as("totalLosses"),
        currentQuantity: stock.currentQuantity,
        inventoryDifference: sql<number>`COALESCE(MAX(${inventoryItems.difference}), 0)`.as("inventoryDifference"),
      })
      .from(medications)
      .leftJoin(stock, eq(stock.medicationId, medications.id))
      .leftJoin(saleItems, eq(saleItems.medicationId, medications.id))
      .leftJoin(sales, and(eq(sales.id, saleItems.saleId), ...salesConditions))
      .leftJoin(purchaseItems, eq(purchaseItems.medicationId, medications.id))
      .leftJoin(purchases, and(eq(purchases.id, purchaseItems.purchaseId), ...purchasesConditions))
      .leftJoin(losses, and(eq(losses.medicationId, medications.id), ...lossesConditions))
      .leftJoin(inventoryItems, eq(inventoryItems.medicationId, medications.id))
      .groupBy(medications.id, medications.code, medications.name, stock.currentQuantity)
      .orderBy(medications.name)
      .limit(limit)
      .offset(offset);

    // Count total medications for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(medications);

    const [reportData, totalCountResult] = await Promise.all([reportQuery, countQuery]);

    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate overall totals
    const [salesTotal, purchasesTotal, lossesTotal] = await Promise.all([
      db.select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`.as("total") })
        .from(sales)
        .where(and(...salesConditions)),
      db.select({ total: sql<number>`COALESCE(SUM(${purchases.totalAmount}), 0)`.as("total") })
        .from(purchases)
        .where(and(...purchasesConditions)),
      db.select({ total: sql<number>`COALESCE(SUM(${losses.value}), 0)`.as("total") })
        .from(losses)
        .where(and(...lossesConditions)),
    ]);

    const totalSales = Number(salesTotal[0]?.total || 0);
    const totalPurchases = Number(purchasesTotal[0]?.total || 0);
    const totalLosses = Number(lossesTotal[0]?.total || 0);
    const totalProfit = totalSales - totalPurchases - totalLosses;

    console.log("[06:23 PM CAT, 2025-10-20] GET /api/reports query:", {
      sql: reportQuery.toSQL(),
      params: { startDate, endDate, userId, page, limit },
    });
    console.log("[06:23 PM CAT, 2025-10-20] GET /api/reports result:", {
      count: reportData.length,
      totalCount,
      totalProfit: totalProfit.toFixed(2),
    });

    return NextResponse.json({
      medications: reportData.map(item => ({
        ...item,
        profit: (item.totalSales - item.totalPurchases - item.totalLosses).toFixed(2),
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      summary: {
        totalProfit: totalProfit.toFixed(2),
        totalSales: totalSales.toFixed(2),
        totalPurchases: totalPurchases.toFixed(2),
        totalLosses: totalLosses.toFixed(2),
      },
    });
  } catch (error: any) {
    console.error("[06:23 PM CAT, 2025-10-20] GET /api/reports error:", {
      message: error.message,
      stack: error.stack,
      url: request.url,
    });
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}