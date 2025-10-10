"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Package, User, MapPin, Phone, DollarSign, Clock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface PurchaseItem {
  id: number;
  medicationId: number;
  quantity: number;
  unitPrice: string;
  expiryDate: string | null;
  medication: {
    id: number;
    code: string;
    name: string;
    unit: string | null;
    family: string | null;
  };
}

interface PurchaseDetail {
  id: number;
  totalAmount: string;
  purchaseDate: string;
  status: string;
  createdAt: string;
  supplier: {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
  };
  items: PurchaseItem[];
}

interface PurchaseDetailDialogProps {
  purchaseId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PurchaseDetailDialog({ 
  purchaseId, 
  isOpen, 
  onClose 
}: PurchaseDetailDialogProps) {
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && purchaseId) {
      fetchPurchaseDetails();
    }
  }, [isOpen, purchaseId]);

  const fetchPurchaseDetails = async () => {
    if (!purchaseId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get(`/api/purchases/${purchaseId}`);
      setPurchase(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch purchase details");
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to fetch purchase details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateItemTotal = (quantity: number, unitPrice: string) => {
    return (quantity * parseFloat(unitPrice)).toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Purchase Details - #{purchaseId}
          </DialogTitle>
          <DialogDescription>
            View complete purchase information including items and supplier details
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading purchase details...</span>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-8">
            <p>Error: {error}</p>
            <Button 
              variant="outline" 
              onClick={fetchPurchaseDetails}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {purchase && !loading && !error && (
          <div className="space-y-6">
            {/* Purchase Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Purchase Overview</span>
                  <Badge variant={getStatusBadgeVariant(purchase.status)}>
                    {purchase.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Purchase Date:</span>
                    <span className="font-medium">{formatDate(purchase.purchaseDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Created:</span>
                    <span className="font-medium">{formatDateTime(purchase.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Amount:</span>
                    <span className="font-bold text-primary text-lg">
                      {parseFloat(purchase.totalAmount).toFixed(2)} FBu
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Items:</span>
                    <span className="font-medium">{purchase.items.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supplier Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold text-lg">{purchase.supplier.name}</span>
                  </div>
                  {purchase.supplier.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{purchase.supplier.phone}</span>
                    </div>
                  )}
                  {purchase.supplier.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{purchase.supplier.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Purchase Items */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Items</CardTitle>
                <CardDescription>
                  {purchase.items.length} item(s) in this purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Family</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Expiry Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchase.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          {item.medication.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.medication.name}
                        </TableCell>
                        <TableCell>
                          {item.medication.family || "N/A"}
                        </TableCell>
                        <TableCell>
                          {item.medication.unit || "N/A"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {parseFloat(item.unitPrice).toFixed(2)} FBu
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {calculateItemTotal(item.quantity, item.unitPrice)} FBu
                        </TableCell>
                        <TableCell>
                          {item.expiryDate 
                            ? formatDate(item.expiryDate)
                            : "No expiry"
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                {/* Purchase Summary */}
                <div className="flex justify-end">
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      Total Purchase Amount: {parseFloat(purchase.totalAmount).toFixed(2)} FBu
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {purchase.items.reduce((sum, item) => sum + item.quantity, 0)} total items
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}