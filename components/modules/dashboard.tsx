"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Plus,
  FileText,
  Eye,
} from "lucide-react"

// Mock data for charts
const salesTrendData = [
  { month: "Jan", sales: 4000, purchases: 2400 },
  { month: "Feb", sales: 3000, purchases: 1398 },
  { month: "Mar", sales: 2000, purchases: 9800 },
  { month: "Apr", sales: 2780, purchases: 3908 },
  { month: "May", sales: 1890, purchases: 4800 },
  { month: "Jun", sales: 2390, purchases: 3800 },
]

const recentSalesData = [
  { day: "Mon", sales: 850 },
  { day: "Tue", sales: 920 },
  { day: "Wed", sales: 780 },
  { day: "Thu", sales: 1100 },
  { day: "Fri", sales: 1250 },
  { day: "Sat", sales: 980 },
  { day: "Sun", sales: 650 },
]

// Mock data for low stock items
const lowStockItems = [
  { name: "Paracetamol 500mg", stock: 5, minStock: 50, category: "Painkillers" },
  { name: "Amoxicillin 250mg", stock: 8, minStock: 30, category: "Antibiotics" },
  { name: "Ibuprofen 400mg", stock: 12, minStock: 40, category: "Painkillers" },
  { name: "Cough Syrup", stock: 3, minStock: 20, category: "Syrups" },
]

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Dr. Smith</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Today</p>
          <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">$45,231</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">$2,847</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12.3% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$18,420</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -5.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">12</div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales vs Purchases Trend</CardTitle>
            <CardDescription>Monthly comparison of sales and purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sales: {
                  label: "Sales",
                  color: "hsl(var(--primary))",
                },
                purchases: {
                  label: "Purchases",
                  color: "hsl(var(--secondary))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sales" fill="var(--color-sales)" />
                  <Bar dataKey="purchases" fill="var(--color-purchases)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Sales Trend</CardTitle>
            <CardDescription>Daily sales for the current week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sales: {
                  label: "Daily Sales",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recentSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--color-sales)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-sales)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start gap-3 h-12" size="lg">
              <Plus className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">New Sale</div>
                <div className="text-xs text-muted-foreground">Process customer transaction</div>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-transparent" size="lg">
              <ShoppingCart className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Add Purchase</div>
                <div className="text-xs text-muted-foreground">Record inventory purchase</div>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-transparent" size="lg">
              <FileText className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Generate Report</div>
                <div className="text-xs text-muted-foreground">View sales and inventory reports</div>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Items that need immediate attention</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="text-xs">
                      {item.stock} left
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Min: {item.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
