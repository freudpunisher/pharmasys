'use client';

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  ShoppingCart,
  Package,
  Warehouse,
  FileText,
  AlertCircle,
  BarChart2,
  Settings,
  History
} from "lucide-react";

import { cn } from "@/lib/utils";

interface SidebarProps {
  activeModule: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  userRole: string;
}

// Define which roles can access which modules
const rolePermissions: Record<string, string[]> = {
  admin: ["dashboard", "sales", "purchases", "stock", "movements", "inventory", "losses", "reports", "settings"],
  manager: ["dashboard", "sales", "purchases", "stock", "movements", "inventory", "losses", "reports"],
  pharmacist: ["dashboard", "sales", "stock", "movements", "inventory"],
  cashier: ["dashboard", "sales"],
  inventory_manager: ["dashboard", "stock", "movements", "inventory", "purchases"],
};


export function Sidebar({ activeModule, collapsed, onToggleCollapse, userRole }: SidebarProps) {
  const router = useRouter();

  const allModules = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid, path: "/dashboard" },
    { id: "sales", label: "Sales", icon: ShoppingCart, path: "/sales" },
    { id: "purchases", label: "Purchases", icon: Package, path: "/purchases" },
    { id: "stock", label: "Stock", icon: Warehouse, path: "/stock" },
    { id: "movements", label: "Movements", icon: History, path: "/stock/movements" },
    { id: "inventory", label: "Inventory", icon: FileText, path: "/inventories" },

    { id: "losses", label: "Losses", icon: AlertCircle, path: "/losses" },
    { id: "reports", label: "Reports", icon: BarChart2, path: "/reports" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
  ];

  // Filter modules based on user role
  const allowedModuleIds = rolePermissions[userRole] || ["dashboard"];
  const modules = allModules.filter(module => allowedModuleIds.includes(module.id));

  return (
    <aside
      className={cn(
        "bg-card border-r transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 flex items-center justify-between">
          {!collapsed && <h1 className="text-xl font-bold">Pharmacy</h1>}
          <Button variant="ghost" size="icon" onClick={onToggleCollapse}>
            {collapsed ? ">" : "<"}
          </Button>
        </div>
        <nav className="flex-1">
          {modules.map((module) => (
            <Button
              key={module.id}
              variant={activeModule === module.id ? "secondary" : "ghost"}
              className={cn("w-full justify-start", collapsed && "px-2")}
              onClick={() => router.push(module.path)}
            >
              <module.icon className={cn("h-5 w-5", !collapsed && "mr-2")} />
              {!collapsed && <span>{module.label}</span>}
            </Button>
          ))}
        </nav>
      </div>
    </aside>
  );
}