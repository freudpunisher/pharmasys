'use client';

import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import axiosInstance from '@/lib/axiosInstance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Printer, ArrowUpDown } from 'lucide-react';

interface User {
  id: number;
  username: string;
}

interface MedicationReport {
  medicationId: number;
  medicationCode: string;
  medicationName: string;
  totalSales: number;
  totalPurchases: number;
  totalLosses: number;
  currentQuantity: number;
  inventoryDifference: number;
  profit: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ReportSummary {
  totalProfit: string;
  totalSales: string;
  totalPurchases: string;
  totalLosses: string;
}

export default function ReportsModule() {
  const [report, setReport] = useState<MedicationReport[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [sortBy, setSortBy] = useState<string>('medicationName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current || null,
    documentTitle: `Pharmacy_Profit_Report_${new Date().toISOString().split('T')[0]}`,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get('/api/users');
        setUsers(response.data);
      } catch (err) {
        console.error('[06:51 PM CAT, 2025-10-20] Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        toast({
          title: 'Invalid Date Range',
          description: 'Start date must be before or equal to end date',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (selectedUser !== 'all') params.append('userId', selectedUser);
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());

        const response = await axiosInstance.get(`/api/reports?${params}`);
        const sortedReport = [...response.data.medications].sort((a, b) => {
          const aValue = a[sortBy as keyof MedicationReport];
          const bValue = b[sortBy as keyof MedicationReport];
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          }
          return sortOrder === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
        });
        setReport(sortedReport);
        setSummary(response.data.summary);
        setPagination(response.data.pagination);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to fetch report';
        setError(errorMessage);
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        console.error('[06:51 PM CAT, 2025-10-20] Error fetching report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [startDate, endDate, selectedUser, pagination.page, pagination.limit, sortBy, sortOrder]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Profit Report</h1>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="user">User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div ref={componentRef} className="print-section space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profit Summary</CardTitle>
            <CardDescription>Overview of financial performance</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-500">Error: {error}</div>}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{summary.totalProfit} FBU</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalSales} FBU</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalPurchases} FBU</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Losses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{summary.totalLosses} FBU</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medication Performance</CardTitle>
            <CardDescription>
              Showing {report.length} of {pagination.totalCount} medications
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
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('medicationCode')} className="flex items-center gap-1">
                          Code
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('medicationName')} className="flex items-center gap-1">
                          Name
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('totalSales')} className="flex items-center gap-1">
                          Sales (FBU)
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('totalPurchases')} className="flex items-center gap-1">
                          Purchases (FBU)
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('totalLosses')} className="flex items-center gap-1">
                          Losses (FBU)
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('currentQuantity')} className="flex items-center gap-1">
                          Stock
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('inventoryDifference')} className="flex items-center gap-1">
                          Inv. Diff.
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('profit')} className="flex items-center gap-1">
                          Profit (FBU)
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.map((item) => (
                      <TableRow key={item.medicationId}>
                        <TableCell className="font-mono">{item.medicationCode}</TableCell>
                        <TableCell>{item.medicationName}</TableCell>
                        <TableCell>{item.totalSales} FBU</TableCell>
                        <TableCell>{item.totalPurchases} FBU</TableCell>
                        <TableCell className="text-red-600">{item.totalLosses} FBU</TableCell>
                        <TableCell>{item.currentQuantity}</TableCell>
                        <TableCell className={item.inventoryDifference !== 0 ? 'text-red-600' : ''}>
                          {item.inventoryDifference}
                        </TableCell>
                        <TableCell className={Number(item.profit) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {item.profit} FBU
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} medications)
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        disabled={!pagination.hasPrev}
                      >
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
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}