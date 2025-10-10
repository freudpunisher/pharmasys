// app/api/purchases/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchases, purchaseItems, suppliers, medications, stock } from "@/lib/db/schema";
import { eq, sql, desc, and, gte, lte, like } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const supplierId = searchParams.get("supplierId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let query = db
      .select({
        id: purchases.id,
        totalAmount: purchases.totalAmount,
        purchaseDate: purchases.purchaseDate,
        status: purchases.status,
        supplierName: suppliers.name,
        supplierId: purchases.supplierId,
      })
      .from(purchases)
      .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .orderBy(desc(purchases.purchaseDate))
      .limit(limit)
      .offset(offset);

    const conditions = [];
    if (startDate) conditions.push(gte(purchases.purchaseDate, new Date(startDate)));
    if (endDate) conditions.push(lte(purchases.purchaseDate, new Date(endDate)));
    if (supplierId && supplierId !== "all") conditions.push(eq(purchases.supplierId, parseInt(supplierId)));
    if (status && status !== "all") conditions.push(eq(purchases.status, status));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count for pagination
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(purchases);
    
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [allPurchases, totalResult] = await Promise.all([
      query,
      countQuery
    ]);
    
    const totalCount = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      purchases: allPurchases,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error: any) {
    console.error("GET /api/purchases error:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
    console.log("POST /api/purchases request body:", body);

    const { supplierId, items, purchaseDate } = body;

    // Validate inputs
    if (!supplierId || !items || !Array.isArray(items) || items.length === 0 || !purchaseDate) {
      console.error("Invalid input:", { supplierId, items, purchaseDate });
      return NextResponse.json(
        { error: "Invalid input: supplierId, items array, and purchaseDate are required" },
        { status: 400 }
      );
    }

    // Validate supplier exists
    const supplier = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.id, Number(supplierId)))
      .limit(1);
    if (!supplier[0]) {
      console.error("Supplier not found:", supplierId);
      return NextResponse.json({ error: `Supplier with ID ${supplierId} not found` }, { status: 404 });
    }

    // Validate items and medications
    for (const item of items) {
      if (!item.medicationId || !item.quantity || !item.unitPrice) {
        console.error("Invalid item:", item);
        return NextResponse.json(
          { error: "Invalid item: medicationId, quantity, and unitPrice are required" },
          { status: 400 }
        );
      }
      const medication = await db
        .select({ id: medications.id, name: medications.name })
        .from(medications)
        .where(eq(medications.id, Number(item.medicationId)))
        .limit(1);
      if (!medication[0]) {
        console.error("Medication not found:", item.medicationId);
        return NextResponse.json(
          { error: `Medication with ID ${item.medicationId} not found` },
          { status: 404 }
        );
      }
      if (item.expiryDate && isNaN(new Date(item.expiryDate).getTime())) {
        console.error("Invalid expiry date:", item.expiryDate);
        return NextResponse.json({ error: `Invalid expiryDate for medication ${item.medicationId}` }, { status: 400 });
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + Number(item.quantity) * Number(item.unitPrice), 0);

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create purchase
      const newPurchase = await tx
        .insert(purchases)
        .values({
          supplierId: Number(supplierId),
          totalAmount: totalAmount.toFixed(2),
          purchaseDate: new Date(purchaseDate),
          status: "Pending", // Ensure status is set as per schema
        })
        .returning();

      // Create purchase items
      const purchaseItemsData = items.map((item: any) => ({
        purchaseId: newPurchase[0].id,
        medicationId: Number(item.medicationId),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice).toFixed(2),
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
      }));

      await tx.insert(purchaseItems).values(purchaseItemsData);

      // Don't update stock quantities yet - only when purchase is confirmed
      // Stock will be updated when status changes to "Confirmed"

      return newPurchase[0];
    });

    console.log("Purchase created successfully:", result);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/purchases error:", {
      message: error.message,
      stack: error.stack,
      requestBody: body,
    });
    return NextResponse.json({ error: error.message || "Failed to create purchase" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
    console.log("PUT /api/purchases request body:", body);

    const { purchaseId, status } = body;

    // Validate inputs
    if (!purchaseId || !status) {
      return NextResponse.json(
        { error: "purchaseId and status are required" },
        { status: 400 }
      );
    }

    // Validate status
    if (!['Pending', 'Confirmed', 'Cancelled'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be Pending, Confirmed, or Cancelled" },
        { status: 400 }
      );
    }

    // Get current purchase to check if it exists and current status
    const existingPurchase = await db
      .select({
        id: purchases.id,
        status: purchases.status,
      })
      .from(purchases)
      .where(eq(purchases.id, Number(purchaseId)))
      .limit(1);

    if (!existingPurchase[0]) {
      return NextResponse.json(
        { error: `Purchase with ID ${purchaseId} not found` },
        { status: 404 }
      );
    }

    const currentStatus = existingPurchase[0].status;

    // Prevent updates if already confirmed (unless cancelling)
    if (currentStatus === 'Confirmed' && status !== 'Cancelled') {
      return NextResponse.json(
        { error: "Cannot modify confirmed purchase. Only cancellation is allowed." },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Update purchase status
      const updatedPurchase = await tx
        .update(purchases)
        .set({ status })
        .where(eq(purchases.id, Number(purchaseId)))
        .returning();

      // If status is being changed to "Confirmed", update stock quantities
      if (status === 'Confirmed' && currentStatus !== 'Confirmed') {
        // Get purchase items to update stock
        const items = await tx
          .select({
            medicationId: purchaseItems.medicationId,
            quantity: purchaseItems.quantity,
          })
          .from(purchaseItems)
          .where(eq(purchaseItems.purchaseId, Number(purchaseId)));

        // Update stock for each item
        for (const item of items) {
          await tx
            .update(stock)
            .set({
              currentQuantity: sql`${stock.currentQuantity} + ${item.quantity}`,
              lastUpdated: new Date(),
            })
            .where(eq(stock.medicationId, item.medicationId));
        }
        
        console.log(`Stock updated for ${items.length} items in purchase ${purchaseId}`);
      }
      
      // If status is being changed from "Confirmed" to "Cancelled", reverse stock quantities
      if (status === 'Cancelled' && currentStatus === 'Confirmed') {
        // Get purchase items to reverse stock
        const items = await tx
          .select({
            medicationId: purchaseItems.medicationId,
            quantity: purchaseItems.quantity,
          })
          .from(purchaseItems)
          .where(eq(purchaseItems.purchaseId, Number(purchaseId)));

        // Reverse stock for each item
        for (const item of items) {
          await tx
            .update(stock)
            .set({
              currentQuantity: sql`${stock.currentQuantity} - ${item.quantity}`,
              lastUpdated: new Date(),
            })
            .where(eq(stock.medicationId, item.medicationId));
        }
        
        console.log(`Stock reversed for ${items.length} items in purchase ${purchaseId}`);
      }

      return updatedPurchase[0];
    });

    console.log(`Purchase ${purchaseId} status updated to ${status}`);
    return NextResponse.json({
      success: true,
      purchase: result,
      message: `Purchase status updated to ${status}${status === 'Confirmed' ? '. Stock quantities have been updated.' : ''}`
    });
  } catch (error: any) {
    console.error("PUT /api/purchases error:", {
      message: error.message,
      stack: error.stack,
      requestBody: body,
    });
    return NextResponse.json({ error: error.message || "Failed to update purchase" }, { status: 500 });
  }
}
