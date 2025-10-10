import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventories, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams, pathname } = new URL(request.url);
    const inventoryId = Number(pathname.split("/").pop()); // Extract ID from URL path

    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: "Invalid inventory ID" }, { status: 400 });
    }

    const inventory = await db
      .select({
        id: inventories.id,
        status: inventories.status,
        inventoryDate: inventories.inventoryDate,
        username: users.username,
      })
      .from(inventories)
      .leftJoin(users, eq(inventories.userId, users.id))
      .where(eq(inventories.id, inventoryId))
      .limit(1);

    if (!inventory[0]) {
      return NextResponse.json({ error: `Inventory with ID ${inventoryId} not found` }, { status: 404 });
    }

    return NextResponse.json(inventory[0]);
  } catch (error: any) {
    console.error("GET /api/inventories/[id] error:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}