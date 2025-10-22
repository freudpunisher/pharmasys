'use client';

import { usePathname } from 'next/navigation';
import ClientLayout from '@/components/client-layout';
import { User } from '@/lib/auth';

interface LayoutWrapperProps {
  children: React.ReactNode;
  user: User | null;
}

export default function LayoutWrapper({ children, user }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return isLoginPage ? (
    <>{children}</>
  ) : (
    <ClientLayout user={user}>{children}</ClientLayout>
  );
}