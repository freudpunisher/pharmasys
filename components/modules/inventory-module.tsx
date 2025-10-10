"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Eye, Package, User, Calendar } from "lucide-react";

interface Inventory {
  id: number;
  status: string;
  inventoryDate: string;
  username: string | null;
}

export default function InventoryModule() {
  const router = useRouter();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalInventories: 0,
    completedInventories: 0,
    usersInvolved: 0,
  });

  useEffect(() => {
    const fetchInventories = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("api/inventories");
        setInventories(response.data);
        setStats({
          totalInventories: response.data.length,
          completedInventories: response.data.filter((i: Inventory) => i.status === "completed").length,
          usersInvolved: new Set(response.data.map((i: Inventory) => i.username)).size,
        });
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch inventories");
        toast({
          title: "Error",
          description: err.response?.data?.error || "Failed to fetch inventories",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInventories();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Inventory Management</h1>
        <Button onClick={() => router.push("/inventories/new")} className="gap-2">
          <Package className="h-4 w-4" />
          Start Inventory
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInventories}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Inventories</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedInventories}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Involved</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersInvolved}</div>
            <p className="text-xs text-muted-foreground">Unique users</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory History</CardTitle>
          <CardDescription>View and manage all inventory counts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500">Error: {error}</div>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inventory ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventories.map((inventory) => (
                  <TableRow key={inventory.id}>
                    <TableCell className="font-mono">{inventory.id}</TableCell>
                    <TableCell>{new Date(inventory.inventoryDate).toLocaleDateString()}</TableCell>
                    <TableCell>{inventory.username || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant={inventory.status === "completed" ? "default" : "secondary"}>
                        {inventory.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => router.push(`/inventories/${inventory.id}`)}
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