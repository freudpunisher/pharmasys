"use client";

import { useState, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Printer, 
  Download, 
  Package, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react";

interface StockItem {
  id: number;
  medicationId: number;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastUpdated: string;
  medication: {
    id: number;
    code: string;
    name: string;
    alertLevel: number;
    price: string;
    family: string | null;
    unit: string | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function StockModule() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("all");
  const [stockFilter, setStockFilter] = useState("all"); // all, low, out_of_stock
  const [families, setFamilies] = useState<{id: number; name: string}[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFamilies();
    fetchStockData();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    applyFilters();
  }, [stockItems, searchTerm, selectedFamily, stockFilter]);

  const fetchFamilies = async () => {
    try {
      const response = await axiosInstance.get("api/families");
      setFamilies(response.data);
    } catch (err: any) {
      console.error("Error fetching families:", err);
    }
  };

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("api/stock", {
        params: {
          page: pagination.page,
          limit: pagination.limit
        }
      });
      
      setStockItems(response.data);
      
      // Calculate stats
      const totalItems = response.data.length;
      const totalValue = response.data.reduce((sum: number, item: StockItem) => 
        sum + (item.currentQuantity * parseFloat(item.medication.price)), 0);
      const lowStockCount = response.data.filter((item: StockItem) => 
        item.currentQuantity > 0 && item.currentQuantity <= item.medication.alertLevel).length;
      const outOfStockCount = response.data.filter((item: StockItem) => 
        item.currentQuantity === 0).length;
        
      setStats({
        totalItems,
        totalValue,
        lowStockCount,
        outOfStockCount
      });
      
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch stock data");
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to fetch stock data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = stockItems;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.medication.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply family filter
    if (selectedFamily !== "all") {
      filtered = filtered.filter(item => 
        item.medication.family === selectedFamily
      );
    }

    // Apply stock level filter
    if (stockFilter === "low") {
      filtered = filtered.filter(item => 
        item.currentQuantity > 0 && item.currentQuantity <= item.medication.alertLevel
      );
    } else if (stockFilter === "out_of_stock") {
      filtered = filtered.filter(item => item.currentQuantity === 0);
    }

    setFilteredItems(filtered);
  };

  const getStockStatus = (item: StockItem) => {
    if (item.currentQuantity === 0) {
      return { status: "Out of Stock", variant: "destructive" as const, color: "text-red-600" };
    } else if (item.currentQuantity <= item.medication.alertLevel) {
      return { status: "Low Stock", variant: "secondary" as const, color: "text-yellow-600" };
    } else {
      return { status: "In Stock", variant: "default" as const, color: "text-green-600" };
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;
      
      document.body.innerHTML = `
        <html>
          <head>
            <title>Stock Report - ${new Date().toLocaleDateString()}</title>
            <style>
              @media print {
                @page { 
                  size: A4; 
                  margin: 20mm; 
                }
                body { 
                  font-family: Arial, sans-serif; 
                  font-size: 12px; 
                  line-height: 1.4;
                }
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin-top: 20px;
                }
                th, td { 
                  border: 1px solid #ddd; 
                  padding: 8px; 
                  text-align: left; 
                }
                th { 
                  background-color: #f5f5f5; 
                  font-weight: bold; 
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 30px; 
                  border-bottom: 2px solid #333;
                  padding-bottom: 20px;
                }
                .stats { 
                  display: flex; 
                  justify-content: space-around; 
                  margin: 20px 0; 
                }
                .stat-item { 
                  text-align: center; 
                }
                .no-print { 
                  display: none !important; 
                }
                .status-badge {
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 10px;
                  font-weight: bold;
                }
                .status-out { background-color: #fee; color: #c00; }
                .status-low { background-color: #fff4e6; color: #f57c00; }
                .status-in { background-color: #e8f5e8; color: #2e7d32; }
              }
            </style>
          </head>
          <body>
            ${printContents}
          </body>
        </html>
      `;
      
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  const exportToCSV = () => {
    const headers = ["Code", "Medication", "Family", "Unit", "Current Stock", "Reserved", "Available", "Alert Level", "Status", "Unit Price", "Total Value", "Last Updated"];
    
    const csvData = filteredItems.map(item => [
      item.medication.code,
      item.medication.name,
      item.medication.family || "N/A",
      item.medication.unit || "N/A",
      item.currentQuantity,
      item.reservedQuantity,
      item.availableQuantity,
      item.medication.alertLevel,
      getStockStatus(item).status,
      `${parseFloat(item.medication.price)} FBu`,
      `${(item.currentQuantity * parseFloat(item.medication.price))} FBu`,
      new Date(item.lastUpdated).toLocaleString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Stock Management</h1>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
          <Button onClick={fetchStockData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Unique medications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalValue.toFixed(2)} FBu</div>
            <p className="text-xs text-muted-foreground">Current stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">Urgent attention needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="family">Family</Label>
              <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                <SelectTrigger>
                  <SelectValue placeholder="All families" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Families</SelectItem>
                  {families.map((family) => (
                    <SelectItem key={family.id} value={family.name}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock-filter">Stock Level</Label>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="per-page">Items per page</Label>
              <Select 
                value={pagination.limit.toString()} 
                onValueChange={(value) => setPagination({...pagination, limit: parseInt(value), page: 1})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
          <CardDescription>
            Showing {filteredItems.length} of {stats.totalItems} items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-center py-8">Loading stock data...</div>}
          {error && <div className="text-red-500 text-center py-8">Error: {error}</div>}
          
          {!loading && !error && (
            <>
              <div ref={printRef}>
                <div className="header no-print">
                  <h1 style={{fontSize: "24px", fontWeight: "bold", margin: "0 0 10px 0"}}>PharmaCare - Stock Report</h1>
                  <p style={{margin: "5px 0"}}>Generated on: {new Date().toLocaleString()}</p>
                  <div className="stats">
                    <div className="stat-item">
                      <div style={{fontSize: "18px", fontWeight: "bold"}}>{stats.totalItems}</div>
                      <div>Total Items</div>
                    </div>
                    <div className="stat-item">
                      <div style={{fontSize: "18px", fontWeight: "bold"}}>{stats.totalValue.toFixed(2)} FBu</div>
                      <div>Total Value</div>
                    </div>
                    <div className="stat-item">
                      <div style={{fontSize: "18px", fontWeight: "bold", color: "#f57c00"}}>{stats.lowStockCount}</div>
                      <div>Low Stock</div>
                    </div>
                    <div className="stat-item">
                      <div style={{fontSize: "18px", fontWeight: "bold", color: "#c00"}}>{stats.outOfStockCount}</div>
                      <div>Out of Stock</div>
                    </div>
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Family</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Reserved</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Alert Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const stockStatus = getStockStatus(item);
                      const totalValue = item.currentQuantity * parseFloat(item.medication.price);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.medication.code}</TableCell>
                          <TableCell className="font-medium">{item.medication.name}</TableCell>
                          <TableCell>{item.medication.family || "N/A"}</TableCell>
                          <TableCell>{item.medication.unit || "N/A"}</TableCell>
                          <TableCell className="text-center">{item.currentQuantity}</TableCell>
                          <TableCell className="text-center">{item.reservedQuantity}</TableCell>
                          <TableCell className="text-center font-semibold">{item.availableQuantity}</TableCell>
                          <TableCell className="text-center">{item.medication.alertLevel}</TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant} className={`status-badge ${
                              stockStatus.variant === 'destructive' ? 'status-out' :
                              stockStatus.variant === 'secondary' ? 'status-low' : 'status-in'
                            }`}>
                              {stockStatus.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{parseFloat(item.medication.price).toFixed(2)} FBu</TableCell>
                          <TableCell className="text-right font-semibold">{totalValue.toFixed(2)} FBu</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.lastUpdated).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total items)
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                      disabled={!pagination.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                      disabled={!pagination.hasNext}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}