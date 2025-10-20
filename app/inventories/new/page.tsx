'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axiosInstance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2, Package } from 'lucide-react';

interface Medication {
  id: number;
  code: string;
  name: string;
  currentQuantity: number;
}

interface InventoryLineItem {
  medication: Medication;
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
}

export default function NewInventory() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [lineItems, setLineItems] = useState<InventoryLineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = 1; // Replace with actual user ID from JWT or auth context

  useEffect(() => {
    const fetchStock = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('api/stock');
        setMedications(response.data.map((item: any) => ({
          id: item.medicationId,
          code: item.medication.code,
          name: item.medication.name,
          currentQuantity: item.currentQuantity,
        })));
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch stock');
        toast({
          title: 'Error',
          description: err.response?.data?.error || 'Failed to fetch stock',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, []);

  const addLineItem = () => {
    if (medications.length === 0) return;
    const newItem: InventoryLineItem = {
      medication: medications[0],
      expectedQuantity: medications[0].currentQuantity,
      countedQuantity: 0,
      difference: -medications[0].currentQuantity,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (index: number, field: keyof InventoryLineItem, value: any) => {
    const updatedItems = [...lineItems];
    if (field === 'medication') {
      const med = medications.find((m) => m.id === Number(value));
      if (med) {
        updatedItems[index] = {
          ...updatedItems[index],
          medication: med,
          expectedQuantity: med.currentQuantity,
          difference: updatedItems[index].countedQuantity - med.currentQuantity,
        };
      }
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      if (field === 'countedQuantity') {
        updatedItems[index].difference = Number(value) - updatedItems[index].expectedQuantity;
      }
    }
    setLineItems(updatedItems);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const saveInventory = async () => {
    if (lineItems.length === 0) {
      toast({ title: 'Error', description: 'At least one item is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const response = await axiosInstance.post('api/inventories', {
        userId,
        items: lineItems.map((item) => ({
          medicationId: Number(item.medication.id),
          expectedQuantity: Number(item.expectedQuantity),
          countedQuantity: Number(item.countedQuantity),
        })),
      });

      toast({
        title: 'Success',
        description: `Inventory ${response.data.id} created with ${lineItems.length} items`,
      });
      router.push('/inventories');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to create inventory',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Start New Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500">Error: {error}</div>}
          {!loading && !error && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Inventory Items</h3>
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
                        <div className="col-span-4">
                          <Label className="text-xs">Medication</Label>
                          <Select
                            value={item.medication.id.toString()}
                            onValueChange={(value) => updateLineItem(index, 'medication', value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {medications.map((med) => (
                                <SelectItem key={med.id} value={med.id.toString()}>
                                  {med.name} ({med.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <Label className="text-xs">Expected Quantity</Label>
                          <Input
                            type="number"
                            value={item.expectedQuantity}
                            disabled
                            className="h-8 bg-gray-100"
                          />
                        </div>

                        <div className="col-span-2">
                          <Label className="text-xs">Counted Quantity</Label>
                          <Input
                            type="number"
                            value={item.countedQuantity}
                            onChange={(e) => updateLineItem(index, 'countedQuantity', Number.parseInt(e.target.value) || 0)}
                            className="h-8"
                            min="0"
                          />
                        </div>

                        <div className="col-span-2">
                          <Label className="text-xs">Difference</Label>
                          <div className="h-8 flex items-center font-bold text-primary">
                            {item.difference}
                          </div>
                        </div>

                        <div className="col-span-2 flex items-end">
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

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={saveInventory}
                  disabled={lineItems.length === 0 || saving}
                  className="flex-1"
                >
                  {saving ? 'Saving...' : 'Complete Inventory'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/inventories')}
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