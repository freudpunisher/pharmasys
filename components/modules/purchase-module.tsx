"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Eye, Package, DollarSign, ShoppingBasket as Supplier, Calendar, Check, X, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import PurchaseDetailDialog from "./purchase-detail-dialog";

interface Purchase {
  id: number;
  totalAmount: string;
  purchaseDate: string;
  status: string;
  supplierName: string | null;
  supplierId: number;
}

interface Supplier {
  id: number;
  name: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function PurchaseModule() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  
  // Dialog state
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  
  // Pagination
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  const [stats, setStats] = useState({
    totalPurchases: 0,
    purchaseValue: 0,
    activeSuppliers: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    fetchSuppliers();
    fetchPurchases();
  }, [pagination.page, pagination.limit, startDate, endDate, selectedSupplier, selectedStatus]);

  const fetchSuppliers = async () => {
    try {
      const response = await axiosInstance.get("api/suppliers");
      setSuppliers(response.data);
    } catch (err: any) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedSupplier !== "all") params.append("supplierId", selectedSupplier);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      
      const response = await axiosInstance.get(`api/purchases?${params}`);
      const { purchases: purchaseData, pagination: paginationData } = response.data;
      
      setPurchases(purchaseData);
      setPagination(paginationData);
      
      // Calculate stats
      setStats({
        totalPurchases: paginationData.totalCount,
        purchaseValue: purchaseData.reduce((sum: number, p: Purchase) => sum + Number(p.totalAmount), 0),
        activeSuppliers: new Set(purchaseData.map((p: Purchase) => p.supplierName)).size,
        pendingOrders: purchaseData.filter((p: Purchase) => p.status === "Pending").length,
      });
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch purchases");
      toast({ title: "Error", description: err.response?.data?.error || "Failed to fetch purchases", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updatePurchaseStatus = async (purchaseId: number, newStatus: string) => {
    setUpdating(purchaseId);
    try {
      const response = await axiosInstance.put("api/purchases", {
        purchaseId,
        status: newStatus
      });
      
      toast({
        title: "Success",
        description: response.data.message || `Purchase status updated to ${newStatus}`,
      });
      
      // Refresh the purchases list
      fetchPurchases();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to update purchase status",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Pending":
        return "secondary" as const;
      case "Confirmed":
        return "default" as const;
      case "Cancelled":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const handleViewPurchase = (purchaseId: number) => {
    setSelectedPurchaseId(purchaseId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPurchaseId(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Purchase Management</h1>
        <Button onClick={() => router.push("/purchases/new")} className="gap-2">
          <Package className="h-4 w-4" />
          Add Purchase
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchases}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.purchaseValue.toFixed(2)} FBu</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Supplier className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSuppliers}</div>
            <p className="text-xs text-muted-foreground">Registered suppliers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="All suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>
            Showing {purchases.length} of {pagination.totalCount} purchase orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500">Error: {error}</div>}
          {!loading && !error && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-mono">{purchase.id}</TableCell>
                      <TableCell>{new Date(purchase.purchaseDate).toLocaleDateString()}</TableCell>
                      <TableCell>{purchase.supplierName || "Unknown"}</TableCell>
                      <TableCell className="font-bold">{Number(purchase.totalAmount).toFixed(2)} FBu</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(purchase.status)}>
                          {purchase.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {purchase.status === "Pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                onClick={() => updatePurchaseStatus(purchase.id, "Confirmed")}
                                disabled={updating === purchase.id}
                              >
                                {updating === purchase.id ? (
                                  <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                Confirm
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                onClick={() => updatePurchaseStatus(purchase.id, "Cancelled")}
                                disabled={updating === purchase.id}
                              >
                                <X className="h-4 w-4" />
                                Cancel
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleViewPurchase(purchase.id)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total purchases)
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
                    <span className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
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
      
      {/* Purchase Detail Dialog */}
      <PurchaseDetailDialog
        purchaseId={selectedPurchaseId}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
      />
    </div>
  );
}
