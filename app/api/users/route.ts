import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Replace with env variable in production

export async function GET(request: NextRequest) {
  try {
    // Verify JWT and role
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      console.error("[12:38 PM CAT, 2025-10-22] GET /api/users error: No token provided");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string; email: string; role: string };
    if (!['admin', 'manager','cashier'].includes(decoded.role)) {
      console.error("[12:38 PM CAT, 2025-10-22] GET /api/users error: Unauthorized role", {
        role: decoded.role,
        userId: decoded.userId,
      });
      return NextResponse.json({ error: "Forbidden: Admin or manager role required" }, { status: 403 });
    }

    // Fetch users, excluding password
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users);

    console.log("[12:38 PM CAT, 2025-10-22] GET /api/users: Fetched", {
      count: allUsers.length,
      userId: decoded.userId,
      role: decoded.role,
    });
    return NextResponse.json(allUsers);
  } catch (error: any) {
    console.error("[12:38 PM CAT, 2025-10-22] GET /api/users error:", {
      message: error.message,
      stack: error.stack,
    });
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, role } = body;

    // Validate required fields
    if (!username || !email || !password) {
      console.error("[12:38 PM CAT, 2025-10-22] POST /api/users error: Missing required fields", {
        username,
        email,
      });
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength (e.g., minimum 8 characters)
    if (password.length < 8) {
      console.error("[12:38 PM CAT, 2025-10-22] POST /api/users error: Password too short", {
        username,
        email,
      });
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Validate role (must be admin, manager, or cashier)
    const validRoles = ["admin", "manager", "cashier"];
    const userRole = role || "cashier"; // Default to cashier if not provided
    if (!validRoles.includes(userRole)) {
      console.error("[12:38 PM CAT, 2025-10-22] POST /api/users error: Invalid role", {
        username,
        email,
        role,
      });
      return NextResponse.json(
        { error: "Role must be one of: admin, manager, cashier" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const newUser = await db
      .insert(users)
      .values({
        username,
        email,
        password: hashedPassword,
        role: userRole,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    console.log("[12:38 PM CAT, 2025-10-22] POST /api/users: Created user", {
      userId: newUser[0].id,
      username,
      email,
      role: userRole,
    });

    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error: any) {
    console.error("[12:38 PM CAT, 2025-10-22] POST /api/users error:", {
      message: error.message,
      stack: error.stack,
    });
    // Handle unique constraint violations (e.g., duplicate username or email)
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}