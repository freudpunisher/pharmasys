import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventories, inventoryItems, users, medications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allInventories = await db
      .select({
        id: inventories.id,
        status: inventories.status,
        inventoryDate: inventories.inventoryDate,
        username: users.username,
      })
      .from(inventories)
      .leftJoin(users, eq(inventories.userId, users.id));

    return NextResponse.json(allInventories);
  } catch (error: any) {
    console.error("GET /api/inventories error:", {
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
    console.log("POST /api/inventories request body:", body);

    const { userId, items } = body;

    // Validate inputs
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      console.error("Invalid input:", { userId, items });
      return NextResponse.json(
        { error: "Invalid input: userId and items array are required" },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await db.select({ id: users.id }).from(users).where(eq(users.id, Number(userId))).limit(1);
    if (!user[0]) {
      console.error("User not found:", userId);
      return NextResponse.json({ error: `User with ID ${userId} not found` }, { status: 404 });
    }

    // Validate items and medications
    for (const item of items) {
      if (!item.medicationId || item.expectedQuantity == null || item.countedQuantity == null) {
        console.error("Invalid item:", item);
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
        console.error("Medication not found:", item.medicationId);
        return NextResponse.json(
          { error: `Medication with ID ${item.medicationId} not found` },
          { status: 404 }
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

      // Update medication stock
      for (const item of items) {
        await tx
          .update(medications)
          .set({ stockQuantity: Number(item.countedQuantity) })
          .where(eq(medications.id, Number(item.medicationId)));
      }

      return newInventory[0];
    });

    console.log("Inventory created successfully:", result);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/inventories error:", {
      message: error.message,
      stack: error.stack,
      requestBody: body,
    });
    return NextResponse.json({ error: error.message || "Failed to create inventory" }, { status: 500 });
  }
}