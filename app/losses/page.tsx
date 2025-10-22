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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { TrendingDown, DollarSign, AlertTriangle, Calendar, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface Loss {
  id: number;
  quantity: number;
  reason: string;
  value: string;
  lossDate: string;
  medicationName: string;
  medicationCode: string;
  username: string;
  status: string;
  description: string | null;
}

interface Medication {
  id: number;
  code: string;
  name: string;
}

interface User {
  id: number;
  username: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function LossModule() {
  const router = useRouter();
  const [losses, setLosses] = useState<Loss[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoss, setSelectedLoss] = useState<Loss | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'quantity' | 'value'>('date-desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedReason, setSelectedReason] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMedication, setSelectedMedication] = useState('all');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState({
    totalLosses: 0,
    lossValue: 0,
    mostCommonReason: 'N/A',
    pendingCount: 0,
  });

  const lossReasons = ['Expired', 'Damaged', 'Theft', 'Breakage', 'Contamination', 'Recall', 'Other'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [lossesResponse, medicationsResponse, usersResponse] = await Promise.all([
          axiosInstance.get(`/api/losses?page=${pagination.page}&limit=${pagination.limit}&startDate=${startDate}&endDate=${endDate}&userId=${selectedUser}&reason=${selectedReason}&status=${selectedStatus}&medicationId=${selectedMedication}`),
          axiosInstance.get('/api/medications'),
          axiosInstance.get('/api/users'),
        ]);

        const { losses: lossesData, pagination: paginationData } = lossesResponse.data;
        const sortedLosses = [...lossesData].sort((a, b) => {
          if (sortBy === 'date-desc') {
            return new Date(b.lossDate).getTime() - new Date(a.lossDate).getTime();
          } else if (sortBy === 'date-asc') {
            return new Date(a.lossDate).getTime() - new Date(b.lossDate).getTime();
          } else if (sortBy === 'quantity') {
            return b.quantity - a.quantity;
          } else {
            return Number(b.value) - Number(a.value);
          }
        });

        setLosses(sortedLosses);
        setMedications(medicationsResponse.data);
        setUsers(usersResponse.data);
        setPagination(paginationData);
        setStats({
          totalLosses: paginationData.totalCount,
          lossValue: sortedLosses.reduce((sum: number, loss: Loss) => sum + Number(loss.value), 0),
          mostCommonReason: sortedLosses.length
            ? Object.entries(
                sortedLosses.reduce((acc: Record<string, number>, loss: Loss) => {
                  acc[loss.reason] = (acc[loss.reason] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).reduce((a, b) => (b[1] > a[1] ? b : a), ['N/A', 0])[0]
            : 'N/A',
          pendingCount: sortedLosses.filter((loss: Loss) => loss.status === 'Pending').length,
        });
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to fetch losses';
        setError(errorMessage);
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        console.error('[05:27 PM CAT, 2025-10-20] Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pagination.page, pagination.limit, startDate, endDate, selectedUser, selectedReason, selectedStatus, selectedMedication, sortBy]);

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'Expired':
        return 'bg-orange-100 text-orange-800';
      case 'Damaged':
        return 'bg-red-100 text-red-800';
      case 'Theft':
        return 'bg-purple-100 text-purple-800';
      case 'Breakage':
        return 'bg-yellow-100 text-yellow-800';
      case 'Contamination':
        return 'bg-red-100 text-red-800';
      case 'Recall':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLosses = losses.filter(
    (loss) =>
      loss.id.toString().includes(searchTerm) ||
      loss.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loss.medicationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loss.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Loss Management</h1>
        <Button onClick={() => router.push('/losses/new')} className="gap-2">
          <TrendingDown className="h-4 w-4" />
          Record Loss
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Losses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.totalLosses}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loss Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${stats.lossValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mostCommonReason}</div>
            <p className="text-xs text-muted-foreground">Loss reason</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

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
                  placeholder="Search by ID, medication, or user..."
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
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger>
                  <SelectValue placeholder="All reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  {lossReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort">Sort By</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {sortBy === 'date-desc' ? 'Date (Newest)' : sortBy === 'date-asc' ? 'Date (Oldest)' : sortBy === 'quantity' ? 'Quantity' : 'Value'}
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
                  <DropdownMenuItem onClick={() => setSortBy('quantity')}>
                    Quantity
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('value')}>
                    Value
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loss History</CardTitle>
          <CardDescription>
            Showing {filteredLosses.length} of {pagination.totalCount} loss records
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
                    <TableHead>Loss ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLosses.map((loss) => (
                    <TableRow key={loss.id}>
                      <TableCell className="font-mono">{loss.id}</TableCell>
                      <TableCell>{new Date(loss.lossDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{loss.medicationName} ({loss.medicationCode})</TableCell>
                      <TableCell>{loss.quantity}</TableCell>
                      <TableCell>
                        <Badge className={getReasonColor(loss.reason)}>{loss.reason}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-destructive">${Number(loss.value).toFixed(2)}</TableCell>
                      <TableCell>{loss.username}</TableCell>
                      <TableCell>
                        <Badge variant={loss.status === 'Approved' ? 'default' : 'secondary'}>{loss.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLoss(loss)}>
                              View Details
                            </Button>
                          </DialogTrigger>
                          {selectedLoss && selectedLoss.id === loss.id && (
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Loss #{selectedLoss.id} Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-medium">Medication</p>
                                  <p>{selectedLoss.medicationName} ({selectedLoss.medicationCode})</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Quantity</p>
                                  <p>{selectedLoss.quantity}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Reason</p>
                                  <p>{selectedLoss.reason}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Value</p>
                                  <p>${Number(selectedLoss.value).toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Date</p>
                                  <p>{new Date(selectedLoss.lossDate).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Reported By</p>
                                  <p>{selectedLoss.username}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Status</p>
                                  <p>{selectedLoss.status}</p>
                                </div>
                                {selectedLoss.description && (
                                  <div>
                                    <p className="text-sm font-medium">Description</p>
                                    <p>{selectedLoss.description}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          )}
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total losses)
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