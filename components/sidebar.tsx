"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  Package,
  Warehouse,
  X,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface SidebarProps {
  activeModule: string
  onModuleChange: (module: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "sale", label: "Sale", icon: DollarSign },
  { id: "purchase", label: "Purchase", icon: ShoppingCart },
  { id: "stock", label: "Stock", icon: Warehouse },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "loss", label: "Loss", icon: X },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
]

export function Sidebar({ activeModule, onModuleChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && <h1 className="text-lg font-heading font-bold text-sidebar-foreground">PharmaCare</h1>}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeModule === item.id

          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                collapsed && "justify-center px-2",
              )}
              onClick={() => onModuleChange(item.id)}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Button>
          )
        })}
      </nav>
    </div>
  )
}
