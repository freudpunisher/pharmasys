'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axiosInstance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { TrendingDown } from 'lucide-react';

interface Medication {
  id: number;
  code: string;
  name: string;
  price: string;
  currentQuantity: number;
}

export default function NewLoss() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMedication, setSelectedMedication] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [lossDate, setLossDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = 1; // Replace with actual user ID from JWT or auth context

  const lossReasons = ['Expired', 'Damaged', 'Theft', 'Breakage', 'Contamination', 'Recall', 'Other'];

  useEffect(() => {
    const fetchStock = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/api/stock');
        setMedications(
          response.data.map((item: any) => ({
            id: item.medicationId,
            code: item.medication.code,
            name: item.medication.name,
            price: item.medication.price,
            currentQuantity: item.currentQuantity,
          }))
        );
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

  const getSelectedMedicationDetails = () => {
    return medications.find((med) => med.id === Number(selectedMedication));
  };

  const calculateLossValue = () => {
    const med = getSelectedMedicationDetails();
    const qty = Number.parseInt(quantity) || 0;
    return med ? Number(med.price) * qty : 0;
  };

  const resetForm = () => {
    setSelectedMedication('');
    setQuantity('');
    setReason('');
    setDescription('');
    setLossDate('');
  };

  const saveLoss = async () => {
    if (!selectedMedication || !quantity || !reason || !lossDate) {
      toast({
        title: 'Error',
        description: 'Medication, quantity, reason, and loss date are required',
        variant: 'destructive',
      });
      return;
    }

    const med = getSelectedMedicationDetails();
    if (med && Number(quantity) > med.currentQuantity) {
      toast({
        title: 'Error',
        description: `Quantity ${quantity} exceeds available stock ${med.currentQuantity}`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await axiosInstance.post('/api/losses', {
        medicationId: Number(selectedMedication),
        userId,
        quantity: Number(quantity),
        reason,
        value: calculateLossValue(),
        lossDate,
        description: description || null,
      });

      toast({
        title: 'Success',
        description: `Loss ${response.data.id} recorded`,
      });
      router.push('/losses');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to record loss',
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
          <CardTitle className="text-2xl">Record Medication Loss</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500">Error: {error}</div>}
          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medication">Medication</Label>
                  <Select value={selectedMedication} onValueChange={setSelectedMedication}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select medication" />
                    </SelectTrigger>
                    <SelectContent>
                      {medications.map((med) => (
                        <SelectItem key={med.id} value={med.id.toString()}>
                          {med.name} ({med.code}) - ${Number(med.price).toFixed(2)} (Stock: {med.currentQuantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Lost</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Loss</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {lossReasons.map((reasonOption) => (
                        <SelectItem key={reasonOption} value={reasonOption}>
                          {reasonOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Loss Date</Label>
                  <Input id="date" type="date" value={lossDate} onChange={(e) => setLossDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide additional details about the loss..."
                  rows={3}
                />
              </div>

              {selectedMedication && quantity && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Loss Summary</p>
                        <p className="text-sm text-muted-foreground">
                          {quantity} units of {getSelectedMedicationDetails()?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-destructive">-${calculateLossValue().toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Total value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={saveLoss}
                  disabled={!selectedMedication || !quantity || !reason || !lossDate || saving}
                  className="flex-1"
                >
                  {saving ? 'Recording...' : 'Record Loss'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/losses')}
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