import './globals.css';
import { Inter } from 'next/font/google';
import LayoutWrapper from '../layout-wrapper';
import { getCurrentUser } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Pharmacy Management System',
  description: 'Manage pharmacy operations efficiently',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  
  console.log('[RootLayout] Rendering layout', { 
    hasUser: !!user, 
    role: user?.role 
  });

  return (
    <html lang="en">
      <body className={inter.className}>
        <LayoutWrapper user={user}>{children}</LayoutWrapper>
      </body>
    </html>
  );
}