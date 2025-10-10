import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { stock, medications, families, units } from "@/lib/db/schema"
import { eq, lt, and, sql } from "drizzle-orm"

// GET /api/stock - Get all stock levels with medication details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lowStock = searchParams.get("lowStock") === "true"
    
    let query = db
      .select({
        id: stock.id,
        medicationId: stock.medicationId,
        currentQuantity: stock.currentQuantity,
        reservedQuantity: stock.reservedQuantity,
        availableQuantity: sql<number>`${stock.currentQuantity} - ${stock.reservedQuantity}`,
        lastUpdated: stock.lastUpdated,
        medication: {
          id: medications.id,
          code: medications.code,
          name: medications.name,
          alertLevel: medications.alertLevel,
          price: medications.price,
          family: families.name,
          unit: units.name,
        }
      })
      .from(stock)
      .leftJoin(medications, eq(stock.medicationId, medications.id))
      .leftJoin(families, eq(medications.familyId, families.id))
      .leftJoin(units, eq(medications.unitId, units.id))

    if (lowStock) {
      query = query.where(lt(stock.currentQuantity, medications.alertLevel))
    }

    const result = await query
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching stock:", error)
    return NextResponse.json({ error: "Failed to fetch stock levels" }, { status: 500 })
  }
}

// POST /api/stock - Update stock quantity (for purchases, sales, adjustments)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { medicationId, quantityChange, operationType, reason } = body

    if (!medicationId || quantityChange === undefined || !operationType) {
      return NextResponse.json(
        { error: "Missing required fields: medicationId, quantityChange, operationType" },
        { status: 400 }
      )
    }

    // Get current stock
    const currentStock = await db
      .select()
      .from(stock)
      .where(eq(stock.medicationId, medicationId))
      .limit(1)

    if (currentStock.length === 0) {
      return NextResponse.json(
        { error: "Medication not found in stock" },
        { status: 404 }
      )
    }

    const current = currentStock[0]

    // Validate operation
    if (operationType === 'sale' || operationType === 'loss') {
      const newQuantity = current.currentQuantity + quantityChange
      if (newQuantity < 0) {
        return NextResponse.json(
          { 
            error: "Insufficient stock", 
            available: current.currentQuantity, 
            requested: Math.abs(quantityChange) 
          },
          { status: 400 }
        )
      }
    }

    // Update stock
    const updatedStock = await db
      .update(stock)
      .set({
        currentQuantity: current.currentQuantity + quantityChange,
        lastUpdated: new Date(),
      })
      .where(eq(stock.medicationId, medicationId))
      .returning()

    // Log the stock movement (you might want to create a stock_movements table for audit trail)
    console.log(`Stock updated: Medication ${medicationId}, Change: ${quantityChange}, Operation: ${operationType}, Reason: ${reason || 'N/A'}`)

    return NextResponse.json({
      success: true,
      stock: updatedStock[0],
      operation: {
        medicationId,
        quantityChange,
        operationType,
        reason,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Error updating stock:", error)
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 })
  }
}

// PUT /api/stock - Set exact stock quantity (for inventory adjustments)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { medicationId, newQuantity, reason } = body

    if (!medicationId || newQuantity === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: medicationId, newQuantity" },
        { status: 400 }
      )
    }

    if (newQuantity < 0) {
      return NextResponse.json(
        { error: "Stock quantity cannot be negative" },
        { status: 400 }
      )
    }

    // Update stock to exact quantity
    const updatedStock = await db
      .update(stock)
      .set({
        currentQuantity: newQuantity,
        lastUpdated: new Date(),
      })
      .where(eq(stock.medicationId, medicationId))
      .returning()

    if (updatedStock.length === 0) {
      return NextResponse.json(
        { error: "Medication not found in stock" },
        { status: 404 }
      )
    }

    console.log(`Stock set: Medication ${medicationId}, New Quantity: ${newQuantity}, Reason: ${reason || 'Manual adjustment'}`)

    return NextResponse.json({
      success: true,
      stock: updatedStock[0],
      operation: {
        medicationId,
        newQuantity,
        operationType: 'adjustment',
        reason,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Error setting stock:", error)
    return NextResponse.json({ error: "Failed to set stock quantity" }, { status: 500 })
  }
}