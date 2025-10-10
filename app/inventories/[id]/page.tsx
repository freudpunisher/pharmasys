"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Package } from "lucide-react";

interface Inventory {
  id: number;
  status: string;
  inventoryDate: string;
  username: string | null;
}

interface InventoryItem {
  id: number;
  medicationId: number;
  medicationName: string;
  medicationCode: string;
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
}

export default function InventoryDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventoryDetails = async () => {
      setLoading(true);
      try {
        const [inventoryRes, itemsRes] = await Promise.all([
          axiosInstance.get(`api/inventories/${id}`),
          axiosInstance.get(`api/inventories/${id}/items`),
        ]);
        setInventory(inventoryRes.data);
        setItems(itemsRes.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch inventory details");
        toast({
          title: "Error",
          description: err.response?.data?.error || "Failed to fetch inventory details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInventoryDetails();
  }, [id]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button
        variant="outline"
        className="mb-4 bg-transparent"
        onClick={() => router.push("/inventories")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Inventories
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Inventory #{id} Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500">Error: {error}</div>}
          {!loading && !error && inventory && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold">Inventory ID</p>
                  <p className="font-mono">{inventory.id}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Status</p>
                  <Badge variant={inventory.status === "completed" ? "default" : "secondary"}>
                    {inventory.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold">Date</p>
                  <p>{new Date(inventory.inventoryDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">User</p>
                  <p>{inventory.username || "Unknown"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Inventory Items</h3>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items found for this inventory</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medication</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Expected Quantity</TableHead>
                        <TableHead>Counted Quantity</TableHead>
                        <TableHead>Difference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.medicationName}</TableCell>
                          <TableCell className="font-mono">{item.medicationCode}</TableCell>
                          <TableCell>{item.expectedQuantity}</TableCell>
                          <TableCell>{item.countedQuantity}</TableCell>
                          <TableCell className={item.difference !== 0 ? "text-red-500" : ""}>
                            {item.difference}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}