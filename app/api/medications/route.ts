import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { medications, families, units, stock } from "@/lib/db/schema"
import { eq, like, or } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const familyId = searchParams.get("familyId")

    let query = db
      .select({
        id: medications.id,
        code: medications.code,
        name: medications.name,
        description: medications.description,
        dosageForm: medications.dosageForm,
        alertLevel: medications.alertLevel,
        price: medications.price,
        stockQuantity: stock.currentQuantity,
        reservedQuantity: stock.reservedQuantity,
        family: families.name,
        unit: units.name,
        familyId: medications.familyId,
        unitId: medications.unitId,
      })
      .from(medications)
      .leftJoin(families, eq(medications.familyId, families.id))
      .leftJoin(units, eq(medications.unitId, units.id))
      .leftJoin(stock, eq(medications.id, stock.medicationId))

    if (search) {
      query = query.where(or(like(medications.name, `%${search}%`), like(medications.code, `%${search}%`)))
    }

    if (familyId) {
      query = query.where(eq(medications.familyId, Number.parseInt(familyId)))
    }

    const result = await query
    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch medications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, name, description, dosageForm, alertLevel, familyId, unitId, price, initialStock = 0 } = body

    // Start a transaction to create medication and stock entry
    const newMedication = await db
      .insert(medications)
      .values({
        code,
        name,
        description,
        dosageForm,
        alertLevel,
        familyId,
        unitId,
        price,
      })
      .returning()

    // Create stock entry for the new medication
    await db
      .insert(stock)
      .values({
        medicationId: newMedication[0].id,
        currentQuantity: initialStock,
        reservedQuantity: 0,
      })

    return NextResponse.json(newMedication[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create medication" }, { status: 500 })
  }
}
