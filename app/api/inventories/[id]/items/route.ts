import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryItems, medications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const pathSegments = pathname.split("/").filter(Boolean); // Split and remove empty segments
    const inventoryId = Number(pathSegments[pathSegments.length - 2]); // Second-to-last segment for /api/inventories/[id]/items

    console.log("Pathname:", pathname, "Extracted inventoryId:", inventoryId);

    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: "Invalid inventory ID" }, { status: 400 });
    }

    const items = await db
      .select({
        id: inventoryItems.id,
        medicationId: inventoryItems.medicationId,
        medicationName: medications.name,
        medicationCode: medications.code,
        expectedQuantity: inventoryItems.expectedQuantity,
        countedQuantity: inventoryItems.countedQuantity,
        difference: inventoryItems.difference,
      })
      .from(inventoryItems)
      .leftJoin(medications, eq(inventoryItems.medicationId, medications.id))
      .where(eq(inventoryItems.inventoryId, inventoryId));

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("GET /api/inventories/[id]/items error:", {
      message: error.message,
      stack: error.stack,
      url: request.url,
    });
    return NextResponse.json({ error: "Failed to fetch inventory items" }, { status: 500 });
  }
}