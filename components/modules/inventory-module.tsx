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
import { Package, User, Calendar, Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface InventoryItem {
  id: number;
  medicationId: number;
  medicationName: string;
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
}

interface Inventory {
  id: number;
  status: string;
  inventoryDate: string;
  username: string | null;
  items: InventoryItem[];
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

export default function InventoryModule() {
  const router = useRouter();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedInventoryId, setExpandedInventoryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'status'>('date-desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState({
    totalInventories: 0,
    completedInventories: 0,
    usersInvolved: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchInventories();
  }, [pagination.page, pagination.limit, startDate, endDate, selectedUser, selectedStatus, sortBy]);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('api/users');
      setUsers(response.data);
    } catch (err: any) {
      console.error('[04:50 PM CAT, 2025-10-20] Error fetching users:', err);
      toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
    }
  };

  const fetchInventories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedUser !== 'all') params.append('userId', selectedUser);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const response = await axiosInstance.get(`api/inventories?${params}`);
      const { inventories: inventoryData, pagination: paginationData } = response.data;

      // Sort inventories
      const sortedInventories = [...inventoryData].sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.inventoryDate).getTime() - new Date(a.inventoryDate).getTime();
        } else if (sortBy === 'date-asc') {
          return new Date(a.inventoryDate).getTime() - new Date(b.inventoryDate).getTime();
        } else {
          return a.status.localeCompare(b.status);
        }
      });

      setInventories(sortedInventories);
      setPagination(paginationData);
      setStats({
        totalInventories: paginationData.totalCount,
        completedInventories: sortedInventories.filter((i: Inventory) => i.status === 'completed').length,
        usersInvolved: new Set(sortedInventories.map((i: Inventory) => i.username)).size,
      });
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch inventories';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      console.error('[04:50 PM CAT, 2025-10-20] Error fetching inventories:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (inventoryId: number) => {
    setExpandedInventoryId(expandedInventoryId === inventoryId ? null : inventoryId);
  };

  const filteredInventories = inventories.filter(
    (inventory) =>
      inventory.id.toString().includes(searchTerm) ||
      (inventory.username?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Inventory Management</h1>
        <Button onClick={() => router.push('/inventories/new')} className="gap-2">
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
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by ID or user..."
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
              <Label htmlFor="sort">Sort By</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {sortBy === 'date-desc' ? 'Date (Newest)' : sortBy === 'date-asc' ? 'Date (Oldest)' : 'Status'}
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
                  <DropdownMenuItem onClick={() => setSortBy('status')}>
                    Status
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory History</CardTitle>
          <CardDescription>
            Showing {filteredInventories.length} of {pagination.totalCount} inventory counts
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
                    <TableHead>Inventory ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventories.map((inventory) => (
                    <>
                      <TableRow
                        key={inventory.id}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleExpand(inventory.id)}
                      >
                        <TableCell className="font-mono">{inventory.id}</TableCell>
                        <TableCell>{new Date(inventory.inventoryDate).toLocaleDateString()}</TableCell>
                        <TableCell>{inventory.username || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant={inventory.status === 'completed' ? 'default' : 'secondary'}>
                            {inventory.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{inventory.items.length}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/inventories/${inventory.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                        <TableCell>
                          {expandedInventoryId === inventory.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedInventoryId === inventory.id && (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="pl-8 pr-4 py-2 bg-muted/50">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Medication</TableHead>
                                    <TableHead>Expected Quantity</TableHead>
                                    <TableHead>Counted Quantity</TableHead>
                                    <TableHead>Difference</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {inventory.items.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell>{item.medicationName}</TableCell>
                                      <TableCell>{item.expectedQuantity}</TableCell>
                                      <TableCell>{item.countedQuantity}</TableCell>
                                      <TableCell className={item.difference < 0 ? 'text-red-500' : item.difference > 0 ? 'text-green-500' : ''}>
                                        {item.difference}
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

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total inventories)
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