import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

export async function GET() {
  try {
    const allUsers = await db.select().from(users)
    return NextResponse.json(allUsers)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, role } = body

    const newUser = await db
      .insert(users)
      .values({
        username,
        email,
        password, // In production, hash this password
        role,
      })
      .returning()

    return NextResponse.json(newUser[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
