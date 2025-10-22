'use client';

import { Button } from '@/components/ui/button';
import { Menu, LogOut } from 'lucide-react';
import { User } from '@/lib/auth';

interface TopBarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  onLogout: () => void;
  useRole:  User | null;
  
}

export function TopBar({ onToggleSidebar, sidebarCollapsed, onLogout, useRole }: TopBarProps) {
  return (
    <header className="bg-card border-b p-4 flex items-center justify-between">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
        <Menu className="h-6 w-6" />
      </Button>
      <h2 className="text-lg font-semibold">Pharmacy Management System</h2>
      <Button variant="ghost" size="icon" onClick={onLogout} title="Logout">
        <LogOut className="h-6 w-6" />
      </Button>
    </header>
  );
}