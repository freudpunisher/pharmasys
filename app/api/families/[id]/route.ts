import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { families } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name } = body

    const updatedFamily = await db
      .update(families)
      .set({ name })
      .where(eq(families.id, Number.parseInt(params.id)))
      .returning()

    if (updatedFamily.length === 0) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 })
    }

    return NextResponse.json(updatedFamily[0])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update family" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deletedFamily = await db
      .delete(families)
      .where(eq(families.id, Number.parseInt(params.id)))
      .returning()

    if (deletedFamily.length === 0) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Family deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete family" }, { status: 500 })
  }
}
