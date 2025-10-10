import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { families } from "@/lib/db/schema"

export async function GET() {
  try {
    const allFamilies = await db.select().from(families)
    return NextResponse.json(allFamilies)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch families" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body
    console.log(name)
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const newFamily = await db
      .insert(families)
      .values({
        name,
      })
      .returning()

    return NextResponse.json(newFamily[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create family" }, { status: 500 })
  }
}
