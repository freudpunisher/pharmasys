import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchases, purchaseItems, suppliers, medications, families, units } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to resolve the dynamic route parameter
    const resolvedParams = await params;
    const purchaseId = parseInt(resolvedParams.id);

    if (isNaN(purchaseId)) {
      return NextResponse.json(
        { error: "Invalid purchase ID" },
        { status: 400 }
      );
    }

    // Get the purchase with supplier information
    const purchaseData = await db
      .select({
        id: purchases.id,
        totalAmount: purchases.totalAmount,
        purchaseDate: purchases.purchaseDate,
        status: purchases.status,
        createdAt: purchases.createdAt,
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          phone: suppliers.phone,
          address: suppliers.address,
        },
      })
      .from(purchases)
      .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .where(eq(purchases.id, purchaseId))
      .limit(1);

    if (purchaseData.length === 0) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    // Get the purchase items with medication details
    const items = await db
      .select({
        id: purchaseItems.id,
        medicationId: purchaseItems.medicationId,
        quantity: purchaseItems.quantity,
        unitPrice: purchaseItems.unitPrice,
        expiryDate: purchaseItems.expiryDate,
        medication: {
          id: medications.id,
          code: medications.code,
          name: medications.name,
          unit: units.name,
          family: families.name,
        },
      })
      .from(purchaseItems)
      .leftJoin(medications, eq(purchaseItems.medicationId, medications.id))
      .leftJoin(families, eq(medications.familyId, families.id))
      .leftJoin(units, eq(medications.unitId, units.id))
      .where(eq(purchaseItems.purchaseId, purchaseId));

    // Sanitize items to handle missing medication data
    const sanitizedItems = items.map(item => ({
      ...item,
      medication: item.medication.id
        ? item.medication
        : {
            id: item.medicationId,
            code: "Unknown",
            name: "Unknown Medication",
            unit: null,
            family: null,
          },
    }));

    const purchase = {
      ...purchaseData[0],
      items: sanitizedItems,
    };

    return NextResponse.json(purchase);
  } catch (error: any) {
    console.error("GET /api/purchases/[id] error:", {
      message: error.message,
      stack: error.stack,
      purchaseId: params ? (await params).id : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to fetch purchase details" },
      { status: 500 }
    );
  }
}