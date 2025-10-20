'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PurchaseItem {
  id: number;
  medicationId: number;
  medicationName: string;
  quantity: number;
  unitPrice: string;
  expiryDate: string | null;
}

interface Purchase {
  id: number;
  totalAmount: string;
  purchaseDate: string;
  status: string;
  supplierName: string | null;
  supplierId: number;
  items: PurchaseItem[];
}

interface PurchaseDetailDialogProps {
  purchase: Purchase | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PurchaseDetailDialog({ purchase, isOpen, onClose }: PurchaseDetailDialogProps) {
  console.log('[04:33 PM CAT, 2025-10-20] PurchaseDetailDialog purchase:', purchase);
  if (!purchase) {
    return null;
  }

  // Ensure items is an array
  const purchaseItems = Array.isArray(purchase.items) ? purchase.items : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Purchase #{purchase.id} Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Purchase Date</p>
              <p>{new Date(purchase.purchaseDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Supplier</p>
              <p>{purchase.supplierName || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Amount</p>
              <p>{Number(purchase.totalAmount).toFixed(2)} FBu</p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p>{purchase.status}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Purchase Items</p>
            {purchaseItems.length === 0 ? (
              <p className="text-muted-foreground">No items found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Expiry Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.medicationName || 'Unknown'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{Number(item.unitPrice).toFixed(2)} FBu</TableCell>
                      <TableCell>{(Number(item.unitPrice) * item.quantity).toFixed(2)} FBu</TableCell>
                      <TableCell>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}