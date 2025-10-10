import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { losses, medications, users } from "@/lib/db/schema";
import { eq, gte, lte, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = db
      .select({
        id: losses.id,
        quantity: losses.quantity,
        reason: losses.reason,
        value: sql`CAST(${losses.value} AS DECIMAL(10,2))`.as("value"),
        lossDate: losses.lossDate,
        medicationName: medications.name,
        username: users.username,
        status: losses.status,
      })
      .from(losses)
      .leftJoin(medications, eq(losses.medicationId, medications.id))
      .leftJoin(users, eq(losses.userId, users.id));

    const conditions = [];
    if (startDate) conditions.push(gte(losses.lossDate, new Date(startDate)));
    if (endDate) conditions.push(lte(losses.lossDate, new Date(endDate)));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query;
    console.log("GET /api/losses query:", query.toSQL());
    console.log("GET /api/losses result:", result);

    if (!result || result.length === 0) {
      console.warn("No losses found for the given criteria");
      return NextResponse.json([]);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/losses error:", {
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
    console.log("POST /api/losses request body:", body);

    const { medicationId, userId, quantity, reason, value, lossDate, description, status = "Pending" } = body;

    // Validate inputs
    if (!medicationId || !userId || !quantity || !reason || !value || !lossDate) {
      console.error("Invalid input:", { medicationId, userId, quantity, reason, value, lossDate });
      return NextResponse.json(
        { error: "Invalid input: medicationId, userId, quantity, reason, value, and lossDate are required" },
        { status: 400 }
      );
    }

    // Validate medication
    const medication = await db
      .select({ id: medications.id, stockQuantity: medications.stockQuantity })
      .from(medications)
      .where(eq(medications.id, Number(medicationId)))
      .limit(1);
    if (!medication[0]) {
      console.error("Medication not found:", medicationId);
      return NextResponse.json({ error: `Medication with ID ${medicationId} not found` }, { status: 404 });
    }
    if (Number(quantity) > medication[0].stockQuantity) {
      console.error("Insufficient stock:", { quantity, stockQuantity: medication[0].stockQuantity });
      return NextResponse.json({ error: `Quantity ${quantity} exceeds available stock ${medication[0].stockQuantity}` }, { status: 400 });
    }

    // Validate user
    const user = await db.select({ id: users.id }).from(users).where(eq(users.id, Number(userId))).limit(1);
    if (!user[0]) {
      console.error("User not found:", userId);
      return NextResponse.json({ error: `User with ID ${userId} not found` }, { status: 404 });
    }

    // Validate reason
    const validReasons = ["Expired", "Damaged", "Theft", "Breakage", "Contamination", "Recall", "Other"];
    if (!validReasons.includes(reason)) {
      console.error("Invalid reason:", reason);
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
          description: description || null,
          status,
        })
        .returning();

      // Update medication stock
      await tx
        .update(medications)
        .set({
          stockQuantity: sql`${medications.stockQuantity} - ${Number(quantity)}`,
        })
        .where(eq(medications.id, Number(medicationId)));

      return newLoss[0];
    });

    console.log("Loss created successfully:", result);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/losses error:", {
      message: error.message,
      stack: error.stack,
      requestBody: body,
    });
    return NextResponse.json({ error: error.message || "Failed to create loss" }, { status: 500 });
  }
}