'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { toast } from '@/components/ui/use-toast';
import { User } from '@/lib/auth';

interface ClientLayoutProps {
  children: React.ReactNode;
  user: User | null;
}

export default function ClientLayout({ children, user }: ClientLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const activeModule = pathname.split('/')[1] || 'dashboard';

  const handleLogout = async () => {
    if (loggingOut) return;
    
    setLoggingOut(true);
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      toast({
        title: 'Success',
        description: 'Logged out successfully',
      });

      router.push('/login');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'destructive',
      });
      console.error('Logout error:', error.message);
    } finally {
      setLoggingOut(false);
    }
  };

  // If no user, show a loading state or redirect will happen via middleware
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeModule={activeModule}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={user.role}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
          onLogout={handleLogout}
          useRole={user}
        />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}