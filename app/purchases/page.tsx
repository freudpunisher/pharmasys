'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axiosInstance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Package, DollarSign, ShoppingBasket as Supplier, Calendar, Check, X, ChevronLeft, ChevronRight, Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import PurchaseDetailDialog from '@/components/modules/purchase-detail-dialog';

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
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'total-desc' | 'total-asc'>('date-desc');

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Pagination
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Stats
  const [stats, setStats] = useState({
    totalPurchases: 0,
    purchaseValue: 0,
    activeSuppliers: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    fetchSuppliers();
    fetchPurchases();
  }, [pagination.page, pagination.limit, startDate, endDate, selectedSupplier, selectedStatus, sortBy]);

  const fetchSuppliers = async () => {
    try {
      const response = await axiosInstance.get('api/suppliers');
      setSuppliers(response.data);
    } catch (err: any) {
      console.error('[04:33 PM CAT, 2025-10-20] Error fetching suppliers:', err);
      toast({ title: 'Error', description: 'Failed to fetch suppliers', variant: 'destructive' });
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedSupplier !== 'all') params.append('supplierId', selectedSupplier);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const response = await axiosInstance.get(`api/purchases?${params}`);
      const { purchases: purchaseData, pagination: paginationData } = response.data;

      // Sort purchases based on sortBy
      const sortedPurchases = [...purchaseData].sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        } else if (sortBy === 'date-asc') {
          return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        } else if (sortBy === 'total-desc') {
          return Number(b.totalAmount) - Number(a.totalAmount);
        } else {
          return Number(a.totalAmount) - Number(b.totalAmount);
        }
      });

      setPurchases(sortedPurchases);
      setPagination(paginationData);

      // Calculate stats
      setStats({
        totalPurchases: paginationData.totalCount,
        purchaseValue: sortedPurchases.reduce((sum: number, p: Purchase) => sum + Number(p.totalAmount), 0),
        activeSuppliers: new Set(sortedPurchases.map((p: Purchase) => p.supplierName)).size,
        pendingOrders: sortedPurchases.filter((p: Purchase) => p.status === 'Pending').length,
      });
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch purchases';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      console.error('[04:33 PM CAT, 2025-10-20] Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePurchaseStatus = async (purchaseId: number, newStatus: string) => {
    setUpdating(purchaseId);
    try {
      const response = await axiosInstance.put('api/purchases', {
        purchaseId,
        status: newStatus,
      });

      toast({
        title: 'Success',
        description: response.data.message || `Purchase status updated to ${newStatus}`,
      });

      // Refresh the purchases list
      await fetchPurchases();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update purchase status';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('[04:33 PM CAT, 2025-10-20] Error updating purchase status:', err);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'secondary' as const;
      case 'Confirmed':
        return 'default' as const;
      case 'Cancelled':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  const toggleExpand = (purchaseId: number) => {
    setExpandedPurchaseId(expandedPurchaseId === purchaseId ? null : purchaseId);
  };

  // Filter purchases by search term
  const filteredPurchases = purchases.filter((purchase) =>
    purchase.id.toString().includes(searchTerm) ||
    (purchase.supplierName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Purchase Management</h1>
        <Button onClick={() => router.push('/purchases/new')} className="gap-2">
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by ID or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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
              <Label htmlFor="sort">Sort By</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {sortBy === 'date-desc' ? 'Date (Newest)' : sortBy === 'date-asc' ? 'Date (Oldest)' : sortBy === 'total-desc' ? 'Total (High to Low)' : 'Total (Low to High)'}
                    <Filter className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy('date-desc')}>
                    Date (Newest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('date-asc')}>
                    Date (Oldest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('total-desc')}>
                    Total (High to Low)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('total-asc')}>
                    Total (Low to High)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>
            Showing {filteredPurchases.length} of {pagination.totalCount} purchase orders
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
                    <TableHead>Items</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => (
                    <>
                      <TableRow
                        key={purchase.id}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleExpand(purchase.id)}
                      >
                        <TableCell className="font-mono">{purchase.id}</TableCell>
                        <TableCell>{new Date(purchase.purchaseDate).toLocaleDateString()}</TableCell>
                        <TableCell>{purchase.supplierName || 'Unknown'}</TableCell>
                        <TableCell className="font-bold">{Number(purchase.totalAmount).toFixed(2)} FBu</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(purchase.status)}>
                            {purchase.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{purchase.items.length}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {purchase.status === 'Pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updatePurchaseStatus(purchase.id, 'Confirmed');
                                  }}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updatePurchaseStatus(purchase.id, 'Cancelled');
                                  }}
                                  disabled={updating === purchase.id}
                                >
                                  <X className="h-4 w-4" />
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {expandedPurchaseId === purchase.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedPurchaseId === purchase.id && (
                        <TableRow>
                          <TableCell colSpan={8}>
                            <div className="pl-8 pr-4 py-2 bg-muted/50">
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
                                  {purchase.items.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell>{item.medicationName}</TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>{Number(item.unitPrice).toFixed(2)} FBu</TableCell>
                                      <TableCell>
                                        {(Number(item.unitPrice) * item.quantity).toFixed(2)} FBu
                                      </TableCell>
                                      <TableCell>
                                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
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
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
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