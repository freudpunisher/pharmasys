import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Replace with env variable in production

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      console.error('[10:52 AM CAT, 2025-10-22] Login error: Missing credentials', { identifier });
      return NextResponse.json({ error: 'Username/email and password are required' }, { status: 400 });
    }

    // Find user by username or email
    const user = await db
      .select()
      .from(users)
      .where(or(eq(users.username, identifier), eq(users.email, identifier)))
      .limit(1);

    if (user.length === 0) {
      console.error('[10:52 AM CAT, 2025-10-22] Login error: User not found', { identifier });
      return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user[0].password);

    if (!isValidPassword) {
      console.error('[10:52 AM CAT, 2025-10-22] Login error: Invalid password', { identifier });
      return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
    }

    // Generate JWT with role
    const token = jwt.sign(
      { userId: user[0].id, username: user[0].username, email: user[0].email, role: user[0].role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('[10:52 AM CAT, 2025-10-22] Login successful:', {
      userId: user[0].id,
      username: user[0].username,
      email: user[0].email,
      role: user[0].role,
    });

    // Set JWT in HTTP-only cookie
    const response = NextResponse.json({ message: 'Login successful' });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[10:52 AM CAT, 2025-10-22] POST /api/login error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}