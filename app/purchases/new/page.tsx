
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2, Package } from "lucide-react";

interface Medication {
  id: number;
  code: string;
  name: string;
  unit: string | null;
  price: string;
  stockQuantity: number;
}

interface Supplier {
  id: number;
  name: string;
}

interface PurchaseLineItem {
  medication: Medication;
  quantity: number;
  unitPrice: number;
  expiryDate: string;
  total: number;
}

export default function NewPurchase() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [lineItems, setLineItems] = useState<PurchaseLineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [suppliersRes, medicationsRes] = await Promise.all([
          axiosInstance.get("api/suppliers"),
          axiosInstance.get("api/medications"),
        ]);
        setSuppliers(suppliersRes.data);
        setMedications(medicationsRes.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch data");
        toast({ title: "Error", description: err.response?.data?.error || "Failed to fetch data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addLineItem = () => {
    if (medications.length === 0) return;
    const newItem: PurchaseLineItem = {
      medication: medications[0],
      quantity: 1,
      unitPrice: Number(medications[0].price) || 0,
      expiryDate: "",
      total: Number(medications[0].price) || 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (index: number, field: keyof PurchaseLineItem, value: any) => {
    const updatedItems = [...lineItems];
    if (field === "medication") {
      const med = medications.find((m) => m.id === Number(value));
      if (med) {
        updatedItems[index] = { ...updatedItems[index], medication: med, unitPrice: Number(med.price) || 0 };
      }
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
    }
    updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    setLineItems(updatedItems);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculatePurchaseTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  };

  const savePurchase = async () => {
    if (!selectedSupplier || !purchaseDate || lineItems.length === 0) {
      toast({ title: "Error", description: "Supplier, purchase date, and at least one item are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const response = await axiosInstance.post("api/purchases", {
        supplierId: Number(selectedSupplier),
        items: lineItems.map((item) => ({
          medicationId: Number(item.medication.id),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice.toFixed(2)),
          expiryDate: item.expiryDate || null,
        })),
        purchaseDate,
      });

      toast({ title: "Success", description: `Purchase ${response.data.id} created with ${lineItems.length} items` });
      router.push("/purchases");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to create purchase",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedSupplier("");
    setPurchaseDate("");
    setLineItems([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Purchase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500">Error: {error}</div>}
          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Purchase Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Purchase Items</h3>
                  <Button onClick={addLineItem} variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                {lineItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items added yet</p>
                    <p className="text-sm">Click "Add Item" to start adding medications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lineItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 p-4 border rounded-lg">
                        <div className="col-span-3">
                          <Label className="text-xs">Medication</Label>
                          <Select
                            value={item.medication.id.toString()}
                            onValueChange={(value) => updateLineItem(index, "medication", value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {medications.map((med) => (
                                <SelectItem key={med.id} value={med.id.toString()}>
                                  {med.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, "quantity", Number.parseInt(e.target.value) || 0)}
                            className="h-8"
                            min="1"
                          />
                        </div>

                        <div className="col-span-2">
                          <Label className="text-xs">Unit Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                            className="h-8"
                            min="0"
                          />
                        </div>

                        <div className="col-span-2">
                          <Label className="text-xs">Expiry Date</Label>
                          <Input
                            type="date"
                            value={item.expiryDate}
                            onChange={(e) => updateLineItem(index, "expiryDate", e.target.value)}
                            className="h-8"
                          />
                        </div>

                        <div className="col-span-2">
                          <Label className="text-xs">Total</Label>
                          <div className="h-8 flex items-center font-bold text-primary">
                            {item.total.toFixed(2)} FBu
                          </div>
                        </div>

                        <div className="col-span-1 flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {lineItems.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Purchase Amount:</span>
                    <span className="text-2xl font-bold text-primary">{calculatePurchaseTotal().toFixed(2)} FBu</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={savePurchase}
                  disabled={!selectedSupplier || !purchaseDate || lineItems.length === 0 || saving}
                  className="flex-1"
                >
                  {saving ? "Saving..." : "Save Purchase"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/purchases")}
                  className="bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
