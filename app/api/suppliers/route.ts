import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { suppliers } from "@/lib/db/schema"

export async function GET() {
  try {
    const allSuppliers = await db.select().from(suppliers)
    return NextResponse.json(allSuppliers)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, address } = body

    const newSupplier = await db
      .insert(suppliers)
      .values({
        name,
        phone,
        address,
      })
      .returning()

    return NextResponse.json(newSupplier[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 })
  }
}
