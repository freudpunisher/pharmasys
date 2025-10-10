
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Download, Filter, DollarSign, TrendingUp, Package, Users, AlertTriangle } from "lucide-react";

// Mock data
const productReportData = [
  { name: "Paracetamol", unit: "Tablets", quantity: 2450, sale: 2450 * 5.99, loss: 10, inventory: 150, prime: 40, date: "2024-01-15" },
  { name: "Amoxicillin", unit: "Capsules", quantity: 1875, sale: 1875 * 12.5, loss: 5, inventory: 75, prime: 35, date: "2024-01-12" },
  { name: "Ibuprofen", unit: "Tablets", quantity: 1650, sale: 1650 * 8.25, loss: 0, inventory: 200, prime: 38, date: "2024-02-10" },
  { name: "Cough Syrup", unit: "Bottles", quantity: 945, sale: 945 * 15.75, loss: 2, inventory: 45, prime: 30, date: "2024-03-05" },
  { name: "Vitamins", unit: "Tablets", quantity: 720, sale: 720 * 10.0, loss: 0, inventory: 100, prime: 25, date: "2024-04-01" },
];

const salesByMedicationData = [
  { medication: "Paracetamol", sales: 2450, profit: 980 },
  { medication: "Amoxicillin", sales: 1875, profit: 750 },
  { medication: "Ibuprofen", sales: 1650, profit: 660 },
  { medication: "Cough Syrup", sales: 945, profit: 378 },
  { medication: "Vitamins", sales: 720, profit: 288 },
];

const monthlyTrendsData = [
  { month: "Jan", sales: 12500, purchases: 8200, profit: 4300 },
  { month: "Feb", sales: 13200, purchases: 8800, profit: 4400 },
  { month: "Mar", sales: 11800, purchases: 7900, profit: 3900 },
  { month: "Apr", sales: 14500, purchases: 9200, profit: 5300 },
  { month: "May", sales: 15200, purchases: 9800, profit: 5400 },
  { month: "Jun", sales: 16100, purchases: 10200, profit: 5900 },
];

const salesByFamilyData = [
  { name: "Painkillers", value: 35, color: "#0891b2" },
  { name: "Antibiotics", value: 25, color: "#f97316" },
  { name: "Syrups", value: 20, color: "#10b981" },
  { name: "Vitamins", value: 12, color: "#8b5cf6" },
  { name: "Others", value: 8, color: "#f59e0b" },
];

const topPerformersData = [
  { cashier: "Dr. Smith", sales: 45, revenue: 12450 },
  { cashier: "Pharmacist A", sales: 38, revenue: 10200 },
  { cashier: "Pharmacist B", sales: 32, revenue: 8750 },
  { cashier: "Dr. Johnson", sales: 28, revenue: 7800 },
];

export default function ReportsModule() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [productFilter, setProductFilter] = useState("");

  const families = ["Painkillers", "Antibiotics", "Syrups", "Vitamins", "Others"];
  const suppliers = ["MedSupply Co.", "PharmaCorp Ltd.", "HealthDist Inc."];
  const users = ["Dr. Smith", "Pharmacist A", "Pharmacist B", "Dr. Johnson"];

  // Filter product report data
  const filteredProductData = useMemo(() => {
    return productReportData.filter((item) => {
      const itemDate = new Date(item.date);
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      const nameMatch = productFilter ? item.name.toLowerCase().includes(productFilter.toLowerCase()) : true;
      const dateMatch =
        (!from || itemDate >= from) && (!to || itemDate <= to);
      return nameMatch && dateMatch;
    });
  }, [dateFrom, dateTo, productFilter]);

  // Update KPI calculations based on filtered data
  const kpiData = useMemo(() => {
    const totalProfit = filteredProductData.reduce((sum, item) => sum + (item.sale * (item.prime / 100)), 0);
    const totalLosses = filteredProductData.reduce((sum, item) => sum + item.loss, 0);
    const bestSellingItem = filteredProductData.reduce((prev, curr) => (curr.quantity > prev.quantity ? curr : prev), filteredProductData[0] || { name: "N/A", quantity: 0 });
    const topPerformer = topPerformersData.reduce((prev, curr) => (curr.revenue > prev.revenue ? curr : prev), topPerformersData[0] || { cashier: "N/A", revenue: 0 });

    return {
      totalProfit: totalProfit.toFixed(2),
      bestSellingItem: bestSellingItem.name,
      bestSellingQuantity: bestSellingItem.quantity,
      totalLosses: totalLosses.toFixed(0),
      totalLossValue: filteredProductData.reduce((sum, item) => sum + (item.loss * (item.sale / item.quantity)), 0).toFixed(2),
      topPerformer: topPerformer.cashier,
      topPerformerRevenue: topPerformer.revenue,
    };
  }, [filteredProductData]);

  // Filter chart data (optional, kept static for simplicity)
  const filteredMonthlyTrends = monthlyTrendsData; // Could filter by date range if needed
  const filteredSalesByFamily = salesByFamilyData; // Could filter by family if needed
  const filteredSalesByMedication = salesByMedicationData.filter((item) =>
    filteredProductData.some((product) => product.name === item.medication)
  );
  const filteredTopPerformers = topPerformersData.filter((item) =>
    selectedUser === "all" || item.cashier === selectedUser
  );

  // Generate LaTeX for PDF
  const generatePDF = () => {
    const latexContent = `
\\documentclass[a4paper]{article}
\\usepackage{geometry}
\\geometry{margin=1in}
\\usepackage{booktabs}
\\usepackage{pdflscape}
\\usepackage{siunitx}
\\sisetup{round-mode=places, round-precision=2}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{xcolor}
\\definecolor{primary}{HTML}{0891b2}
\\definecolor{destructive}{HTML}{dc2626}

\\begin{document}

\\begin{center}
  \\textbf{\\Large Pharmacy Product Report} \\\\
  \\vspace{0.2cm}
  \\small Generated on ${new Date().toLocaleDateString()}
\\end{center}

\\vspace{0.5cm}

\\begin{flushleft}
  \\textbf{Filters Applied:} \\\\
  Date From: ${dateFrom || "N/A"} \\\\
  Date To: ${dateTo || "N/A"} \\\\
  Product Name: ${productFilter || "All"}
\\end{flushleft}

\\vspace{0.5cm}

\\begin{landscape}
\\begin{table}[h]
  \\centering
  \\caption{Product Report}
  \\begin{tabular}{llS[table-format=4.0]S[table-format=6.2]S[table-format=3.0]S[table-format=3.0]S[table-format=2.0]l}
    \\toprule
    \\textbf{Name} & \\textbf{Unit} & \\textbf{Quantity} & \\textbf{Sale (\\$)} & \\textbf{Loss} & \\textbf{Inventory} & \\textbf{Prime (\\%)} & \\textbf{Date} \\\\
    \\midrule
${filteredProductData
  .map(
    (item) =>
      `    ${item.name} & ${item.unit} & ${item.quantity} & ${item.sale.toFixed(2)} & ${item.loss} & ${item.inventory} & ${item.prime} & ${item.date} \\\\`
  )
  .join("\n")}
    \\bottomrule
  \\end{tabular}
\\end{table}
\\end{landscape}

\\end{document}
`;

    const blob = new Blob([latexContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_report.tex";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent" onClick={generatePDF}>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
          <CardDescription>Filter data to generate specific reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                placeholder="Filter by product name"
              />
            </div>
            <div className="space-y-2">
              <Label>Family</Label>
              <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Families</SelectItem>
                  {families.map((family) => (
                    <SelectItem key={family} value={family}>
                      {family}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${kpiData.totalProfit}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Filtered data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Selling Item</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.bestSellingItem}</div>
            <p className="text-xs text-muted-foreground">{kpiData.bestSellingQuantity} units sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Losses</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${kpiData.totalLossValue}</div>
            <p className="text-xs text-muted-foreground">{kpiData.totalLosses} items lost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.topPerformer}</div>
            <p className="text-xs text-muted-foreground">${kpiData.topPerformerRevenue.toLocaleString()} in sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Product Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Report</CardTitle>
          <CardDescription>Detailed product performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Sale ($)</TableHead>
                <TableHead>Loss</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Prime (%)</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProductData.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.quantity.toLocaleString()}</TableCell>
                  <TableCell className="text-primary font-bold">${item.sale.toFixed(2)}</TableCell>
                  <TableCell className="text-destructive">{item.loss}</TableCell>
                  <TableCell>{item.inventory}</TableCell>
                  <TableCell>{item.prime}%</TableCell>
                  <TableCell>{item.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Sales, purchases, and profit over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sales: { label: "Sales", color: "hsl(var(--primary))" },
                purchases: { label: "Purchases", color: "hsl(var(--secondary))" },
                profit: { label: "Profit", color: "hsl(var(--chart-3))" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredMonthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="sales" stroke="var(--color-sales)" strokeWidth={2} />
                  <Line type="monotone" dataKey="purchases" stroke="var(--color-purchases)" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" stroke="var(--color-profit)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Family</CardTitle>
            <CardDescription>Distribution of sales across medication families</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Percentage", color: "hsl(var(--primary))" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredSalesByFamily}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {filteredSalesByFamily.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Medication</CardTitle>
            <CardDescription>Top performing medications</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalesByMedication.map((item) => (
                  <TableRow key={item.medication}>
                    <TableCell className="font-medium">{item.medication}</TableCell>
                    <TableCell>${item.sales.toLocaleString()}</TableCell>
                    <TableCell className="text-primary font-bold">${item.profit.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Staff performance by sales</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Sales Count</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTopPerformers.map((performer) => (
                  <TableRow key={performer.cashier}>
                    <TableCell className="font-medium">{performer.cashier}</TableCell>
                    <TableCell>{performer.sales}</TableCell>
                    <TableCell className="text-primary font-bold">${performer.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
