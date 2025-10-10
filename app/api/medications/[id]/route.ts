import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { medications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const medication = await db
      .select()
      .from(medications)
      .where(eq(medications.id, Number.parseInt(params.id)))

    if (medication.length === 0) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 })
    }

    return NextResponse.json(medication[0])
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch medication" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { code, name, description, dosageForm, alertLevel, familyId, unitId, price, stockQuantity } = body

    const updatedMedication = await db
      .update(medications)
      .set({ code, name, description, dosageForm, alertLevel, familyId, unitId, price, stockQuantity })
      .where(eq(medications.id, Number.parseInt(params.id)))
      .returning()

    if (updatedMedication.length === 0) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 })
    }

    return NextResponse.json(updatedMedication[0])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update medication" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deletedMedication = await db
      .delete(medications)
      .where(eq(medications.id, Number.parseInt(params.id)))
      .returning()

    if (deletedMedication.length === 0) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Medication deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete medication" }, { status: 500 })
  }
}
