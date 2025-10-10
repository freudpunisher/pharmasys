
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Eye, Package, DollarSign, ShoppingBasket as Supplier, Calendar } from "lucide-react";

interface Purchase {
  id: number;
  totalAmount: string;
  purchaseDate: string;
  status: string;
  supplierName: string | null;
}

export default function PurchaseModule() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    purchaseValue: 0,
    activeSuppliers: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("api/purchases");
        setPurchases(response.data);
        // Calculate stats
        setStats({
          totalPurchases: response.data.length,
          purchaseValue: response.data.reduce((sum: number, p: Purchase) => sum + Number(p.totalAmount), 0),
          activeSuppliers: new Set(response.data.map((p: Purchase) => p.supplierName)).size,
          pendingOrders: response.data.filter((p: Purchase) => p.status === "Pending").length,
        });
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch purchases");
        toast({ title: "Error", description: err.response?.data?.error || "Failed to fetch purchases", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

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
            <div className="text-2xl font-bold text-primary">${stats.purchaseValue.toFixed(2)}</div>
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

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>View and manage all purchase orders</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500">Error: {error}</div>}
          {!loading && !error && (
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
                    <TableCell className="font-bold">${Number(purchase.totalAmount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={purchase.status === "Completed" ? "default" : "secondary"}>
                        {purchase.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => toast({ title: "Info", description: "View functionality not implemented yet" })}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
