import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, saleItems, medications, users, stock } from "@/lib/db/schema";
import { eq, gte, lte, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");

    // Fetch sales with related data
    const query = db
      .select({
        id: sales.id,
        totalAmount: sales.totalAmount,
        taxAmount: sales.taxAmount,
        discountAmount: sales.discountAmount,
        saleDate: sales.saleDate,
        username: users.username,
        item: {
          medicationId: saleItems.medicationId,
          name: medications.name,
          quantity: saleItems.quantity,
          unitPrice: saleItems.unitPrice,
        },
      })
      .from(sales)
      .leftJoin(users, eq(sales.userId, users.id))
      .leftJoin(saleItems, eq(sales.id, saleItems.saleId))
      .leftJoin(medications, eq(saleItems.medicationId, medications.id));

    const conditions = [];
    if (startDate) conditions.push(gte(sales.saleDate, new Date(startDate)));
    if (endDate) conditions.push(lte(sales.saleDate, new Date(endDate)));
    if (userId) conditions.push(eq(sales.userId, Number.parseInt(userId)));

    const rawResults = await (conditions.length > 0 ? query.where(and(...conditions)) : query);

    // Group results by sale
    const salesMap = new Map();
    for (const row of rawResults) {
      const saleId = row.id;
      if (!salesMap.has(saleId)) {
        salesMap.set(saleId, {
          id: row.id,
          totalAmount: row.totalAmount,
          taxAmount: row.taxAmount,
          discountAmount: row.discountAmount,
          saleDate: row.saleDate,
          username: row.username,
          items: [],
        });
      }
      // Only add item if it exists (non-null)
      if (row.item.medicationId) {
        salesMap.get(saleId).items.push(row.item);
      }
    }

    // Convert map to array
    const result = Array.from(salesMap.values());

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/sales error:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
    console.log("POST /api/sales request body:", body);

    const { userId, items, taxAmount, discountAmount } = body;

    // Validate inputs
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      console.error("Invalid input:", { userId, items });
      return NextResponse.json({ error: "Invalid input: userId and items array are required" }, { status: 400 });
    }

    // Validate user exists
    const user = await db.select({ id: users.id }).from(users).where(eq(users.id, Number(userId))).limit(1);
    if (!user[0]) {
      console.error("User not found:", userId);
      return NextResponse.json({ error: `User with ID ${userId} not found` }, { status: 404 });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      if (!item.medicationId || !item.quantity || !item.unitPrice) {
        console.error("Invalid item:", item);
        throw new Error("Invalid item: medicationId, quantity, and unitPrice are required");
      }
      return sum + Number(item.quantity) * Number(item.unitPrice);
    }, 0) + Number(taxAmount) - Number(discountAmount);

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Validate stock for all items
      for (const item of items) {
        const medicationWithStock = await tx
          .select({ 
            id: medications.id, 
            name: medications.name,
            currentQuantity: stock.currentQuantity,
            reservedQuantity: stock.reservedQuantity 
          })
          .from(medications)
          .leftJoin(stock, eq(medications.id, stock.medicationId))
          .where(eq(medications.id, Number(item.medicationId)))
          .limit(1);
        
        if (!medicationWithStock[0]) {
          console.error("Medication not found:", item.medicationId);
          throw new Error(`Medication with ID ${item.medicationId} not found`);
        }
        
        const availableQuantity = (medicationWithStock[0].currentQuantity || 0) - (medicationWithStock[0].reservedQuantity || 0);
        if (availableQuantity < Number(item.quantity)) {
          console.error("Insufficient stock:", {
            medication: medicationWithStock[0].name,
            requested: item.quantity,
            available: availableQuantity,
          });
          throw new Error(`Insufficient stock for ${medicationWithStock[0].name}. Available: ${availableQuantity}`);
        }
      }

      // Create sale
      const newSale = await tx
        .insert(sales)
        .values({
          userId: Number(userId),
          totalAmount: totalAmount.toFixed(2),
          taxAmount: Number(taxAmount).toFixed(2),
          discountAmount: Number(discountAmount).toFixed(2),
          saleDate: new Date(),
        })
        .returning();

      // Create sale items
      const saleItemsData = items.map((item: any) => ({
        saleId: newSale[0].id,
        medicationId: Number(item.medicationId),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice).toFixed(2),
      }));

      await tx.insert(saleItems).values(saleItemsData);

      // Update stock quantities
      for (const item of items) {
        await tx
          .update(stock)
          .set({
            currentQuantity: sql`${stock.currentQuantity} - ${Number(item.quantity)}`,
            lastUpdated: new Date(),
          })
          .where(eq(stock.medicationId, Number(item.medicationId)));
      }

      return newSale[0];
    });

    console.log("Sale created successfully:", result);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/sales error:", {
      message: error.message,
      stack: error.stack,
      requestBody: body,
    });
    return NextResponse.json({ error: error.message || "Failed to create sale" }, { status: 500 });
  }
}