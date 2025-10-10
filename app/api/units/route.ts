import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { units } from "@/lib/db/schema"

export async function GET() {
  try {
    const allUnits = await db.select().from(units)
    return NextResponse.json(allUnits)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, conversionRatio } = body

    const newUnit = await db
      .insert(units)
      .values({
        name,
        conversionRatio,
      })
      .returning()

    return NextResponse.json(newUnit[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 })
  }
}
