"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Dashboard } from "@/components/modules/dashboard"
import SaleModule  from "@/components/modules/sale-module"
import PurchaseModule from "@/components/modules/purchase-module"
import StockModule from "@/components/modules/stock-module"
import  InventoryModule  from "@/components/modules/inventory-module"
import LossModule  from "@/components/modules/loss-module"
import ReportsModule  from "@/components/modules/reports-module"
import  SettingsModule  from "@/components/modules/settings-module"

export default function PharmacyManagementSystem() {
  const [activeModule, setActiveModule] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard />
      case "sale":
        return <SaleModule />
      case "purchase":
        return <PurchaseModule />
      case "stock":
        return <StockModule />
      case "inventory":
        return <InventoryModule />
      case "loss":
        return <LossModule />
      case "reports":
        return <ReportsModule />
      case "settings":
        return <SettingsModule />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 overflow-auto p-6">{renderModule()}</main>
      </div>
    </div>
  )
}
