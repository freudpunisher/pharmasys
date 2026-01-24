import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { losses, medications, users, stock } from "@/lib/db/schema";
import { eq, gte, lte, and, sql, desc } from "drizzle-orm";
import { recordStockMovement } from "@/lib/services/stock-service";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");
    const reason = searchParams.get("reason");
    const medicationId = searchParams.get("medicationId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let query: any = db

      .select({
        id: losses.id,
        quantity: losses.quantity,
        reason: losses.reason,
        value: sql`CAST(${losses.value} AS DECIMAL(10,2))`.as("value"),
        lossDate: losses.lossDate,
        medicationName: medications.name,
        medicationCode: medications.code,
        username: users.username,
      })
      .from(losses)
      .leftJoin(medications, eq(losses.medicationId, medications.id))
      .leftJoin(users, eq(losses.userId, users.id))
      .orderBy(desc(losses.lossDate))
      .limit(limit)
      .offset(offset);

    const conditions = [];
    if (startDate) conditions.push(gte(losses.lossDate, new Date(startDate)));
    if (endDate) conditions.push(lte(losses.lossDate, new Date(endDate)));
    if (userId && userId !== "all") conditions.push(eq(losses.userId, parseInt(userId)));
    if (reason && reason !== "all") conditions.push(eq(losses.reason, reason));
    if (medicationId && medicationId !== "all") conditions.push(eq(losses.medicationId, parseInt(medicationId)));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    let countQuery: any = db
      .select({ count: sql<number>`count(*)`.as("count") })

      .from(losses);

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [result, totalResult] = await Promise.all([query, countQuery]);

    const totalCount = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    console.log("[05:35 PM CAT, 2025-10-20] GET /api/losses query:", query.toSQL());
    console.log("[05:35 PM CAT, 2025-10-20] GET /api/losses result:", result);

    if (!result || result.length === 0) {
      console.warn("[05:35 PM CAT, 2025-10-20] No losses found for the given criteria");
      return NextResponse.json({
        losses: [],
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    }

    return NextResponse.json({
      losses: result,
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
    console.error("[05:35 PM CAT, 2025-10-20] GET /api/losses error:", {
      message: error.message,
      stack: error.stack,
      url: request.url,
    });
    return NextResponse.json({ error: "Failed to fetch losses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
    console.log("[05:35 PM CAT, 2025-10-20] POST /api/losses request body:", body);

    const { medicationId, userId, quantity, reason, value, lossDate } = body;

    // Validate inputs
    if (!medicationId || !userId || !quantity || !reason || !value || !lossDate) {
      console.error("[05:35 PM CAT, 2025-10-20] Invalid input:", { medicationId, userId, quantity, reason, value, lossDate });
      return NextResponse.json(
        { error: "Invalid input: medicationId, userId, quantity, reason, value, and lossDate are required" },
        { status: 400 }
      );
    }

    // Validate medication
    const medication = await db
      .select({ id: medications.id })
      .from(medications)
      .where(eq(medications.id, Number(medicationId)))
      .limit(1);
    if (!medication[0]) {
      console.error("[05:35 PM CAT, 2025-10-20] Medication not found:", medicationId);
      return NextResponse.json({ error: `Medication with ID ${medicationId} not found` }, { status: 404 });
    }

    // Validate stock
    const stockRecord = await db
      .select({ currentQuantity: stock.currentQuantity })
      .from(stock)
      .where(eq(stock.medicationId, Number(medicationId)))
      .limit(1);
    if (!stockRecord[0]) {
      console.error("[05:35 PM CAT, 2025-10-20] Stock record not found for medication:", medicationId);
      return NextResponse.json({ error: `Stock record for medication ${medicationId} not found` }, { status: 404 });
    }
    if (Number(quantity) > stockRecord[0].currentQuantity) {
      console.error("[05:35 PM CAT, 2025-10-20] Insufficient stock:", { quantity, currentQuantity: stockRecord[0].currentQuantity });
      return NextResponse.json({ error: `Quantity ${quantity} exceeds available stock ${stockRecord[0].currentQuantity}` }, { status: 400 });
    }

    // Validate user
    const user = await db.select({ id: users.id }).from(users).where(eq(users.id, Number(userId))).limit(1);
    if (!user[0]) {
      console.error("[05:35 PM CAT, 2025-10-20] User not found:", userId);
      return NextResponse.json({ error: `User with ID ${userId} not found` }, { status: 404 });
    }

    // Validate reason
    const validReasons = ["Expired", "Damaged", "Theft", "Breakage", "Contamination", "Recall", "Other"];
    if (!validReasons.includes(reason)) {
      console.error("[05:35 PM CAT, 2025-10-20] Invalid reason:", reason);
      return NextResponse.json({ error: `Invalid reason: must be one of ${validReasons.join(", ")}` }, { status: 400 });
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create loss
      const newLoss = await tx
        .insert(losses)
        .values({
          medicationId: Number(medicationId),
          userId: Number(userId),
          quantity: Number(quantity),
          reason,
          value: Number(value).toFixed(2),
          lossDate: new Date(lossDate),
        })
        .returning();

      // Update stock
      await tx
        .update(stock)
        .set({
          currentQuantity: sql`${stock.currentQuantity} - ${Number(quantity)}`,
          lastUpdated: new Date(),
        })
        .where(eq(stock.medicationId, Number(medicationId)));

      // Record stock movement
      await recordStockMovement({
        medicationId: Number(medicationId),
        type: "loss" as const,
        quantity: -Number(quantity),
        referenceId: newLoss[0].id,
        referenceType: "loss" as const,
        reason: reason,
      }, tx);


      return newLoss[0];
    });

    console.log("[05:35 PM CAT, 2025-10-20] Loss created successfully:", result);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("[05:35 PM CAT, 2025-10-20] POST /api/losses error:", {
      message: error.message,
      stack: error.stack,
      requestBody: body,
    });
    return NextResponse.json({ error: error.message || "Failed to create loss" }, { status: 500 });
  }
}