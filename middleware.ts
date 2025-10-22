import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Define route permissions
const routePermissions: Record<string, string[]> = {
  '/dashboard': ['admin', 'manager', 'pharmacist', 'cashier', 'inventory_manager'],
  '/sales': ['admin', 'manager', 'pharmacist', 'cashier'],
  '/purchases': ['admin', 'manager', 'inventory_manager'],
  '/stock': ['admin', 'manager', 'pharmacist', 'inventory_manager'],
  '/inventory': ['admin', 'manager', 'pharmacist', 'inventory_manager'],
  '/losses': ['admin', 'manager'],
  '/reports': ['admin', 'manager'],
  '/settings': ['admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('Middleware: Checking authentication for path', pathname);

  const publicPaths = ['/login', '/api/login', '/api/logout'];
  const ignoredPaths = ['/_next/', '/favicon.ico'];

  if (publicPaths.includes(pathname) || ignoredPaths.some(p => pathname.startsWith(p))) {
    if (pathname === '/login') {
      const token = request.cookies.get('auth_token')?.value;
      
      if (token) {
        try {
          const secret = new TextEncoder().encode(JWT_SECRET);
          await jwtVerify(token, secret);
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } catch (error) {
          console.log('Invalid token on login page');
        }
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    console.log('No token found, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    const decoded = payload as { 
      userId: number; 
      username: string; 
      email: string; 
      role: string 
    };

    console.log('Token verified for user:', decoded.username, 'Role:', decoded.role);
    
    // Check route permissions
    for (const [route, allowedRoles] of Object.entries(routePermissions)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(decoded.role)) {
          console.log('User does not have permission for this route');
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        break;
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.log('Token verification failed:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};