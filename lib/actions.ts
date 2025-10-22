'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function login(formData: FormData) {
  const identifier = formData.get('identifier');
  const password = formData.get('password');

  if (identifier === 'test@example.com' && password === 'password123') {
    // Create a REAL JWT token that matches what middleware expects
    const token = jwt.sign(
      { 
        userId: 1, 
        username: 'test', 
        email: 'test@example.com', 
        role: 'admin' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    redirect('/dashboard');
  } else {
    return { error: 'Invalid identifier or password.' };
  }
}