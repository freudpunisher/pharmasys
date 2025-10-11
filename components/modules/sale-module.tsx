'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axiosInstance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, Minus, Trash2, ShoppingCart, Filter, Calendar, Package, DollarSign } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { jwtDecode } from 'jwt-decode';

interface Medication {
  id: number;
  code: string;
  name: string;
  description: string | null;
  dosageForm: string;
  alertLevel: number;
  price: string;
  stockQuantity: number;
  reservedQuantity?: number;
  family: string | null;
  unit: string | null;
  familyId: number | null;
  unitId: number | null;
}

interface Sale {
  id: number;
  totalAmount: string;
  taxAmount: string;
  discountAmount: string;
  saleDate: string;
  username: string | null;
}

interface CartItem {
  medication: Medication;
  quantity: number;
}

interface JwtPayload {
  userId: number;
  username: string;
}

export default function SaleModule() {
  const [activeTab, setActiveTab] = useState<'sale' | 'stock' | 'reports'>('sale');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedFamily, setSelectedFamily] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [families, setFamilies] = useState<{ id: number; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: number; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; username: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saleLoading, setSaleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [selectedCashier, setSelectedCashier] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [stockRes, familiesRes, unitsRes, usersRes] = await Promise.all([
          axiosInstance.get('api/stock'),
          axiosInstance.get('api/families'),
          axiosInstance.get('api/units'),
          axiosInstance.get('api/users'),
        ]);
        
        const medicationsWithStock = stockRes.data.map((stockItem: any) => ({
          id: stockItem.medication.id,
          code: stockItem.medication.code,
          name: stockItem.medication.name,
          description: null,
          dosageForm: '',
          alertLevel: stockItem.medication.alertLevel,
          price: stockItem.medication.price,
          stockQuantity: stockItem.currentQuantity,
          reservedQuantity: stockItem.reservedQuantity,
          family: stockItem.medication.family,
          unit: stockItem.medication.unit,
          familyId: null,
          unitId: null,
        }));
        
        setMedications(medicationsWithStock);
        setFamilies(familiesRes.data);
        setUnits(unitsRes.data);
        setUsers(usersRes.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      const fetchSales = async () => {
        setLoading(true);
        try {
          const params: Record<string, string> = {};
          if (dateFilter.startDate) params.startDate = dateFilter.startDate;
          if (dateFilter.endDate) params.endDate = dateFilter.endDate;
          if (selectedCashier !== 'all') params.userId = users.find(u => u.username === selectedCashier)?.id.toString() || '';
          const response = await axiosInstance.get('api/sales', { params });
          setSales(response.data);
          setError(null);
        } catch (err: any) {
          setError(err.response?.data?.error || 'Failed to fetch sales');
        } finally {
          setLoading(false);
        }
      };
      fetchSales();
    }
  }, [activeTab, dateFilter, selectedCashier, users]);

  const handleTabChange = (value: string) => {
    if (['sale', 'stock', 'reports'].includes(value)) {
      setActiveTab(value as 'sale' | 'stock' | 'reports');
    }
  };

  const filteredMedications = medications.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFamily = selectedFamily === 'all' || med.family === selectedFamily;
    const matchesUnit = selectedUnit === 'all' || med.unit === selectedUnit;
    return matchesSearch && matchesFamily && matchesUnit;
  });

  const addToCart = (medication: Medication) => {
    if (medication.stockQuantity < 1) {
      toast({ title: 'Error', description: `${medication.name} is out of stock`, variant: 'destructive' });
      return;
    }
    const existingItem = cart.find((item) => item.medication.id === medication.id);
    if (existingItem) {
      if (existingItem.quantity + 1 > medication.stockQuantity) {
        toast({ title: 'Error', description: `Not enough stock for ${medication.name}`, variant: 'destructive' });
        return;
      }
      setCart(
        cart.map((item) =>
          item.medication.id === medication.id ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      );
    } else {
      setCart([...cart, { medication, quantity: 1 }]);
    }
  };

  const updateQuantity = (medicationId: number, newQuantity: number) => {
    const medication = medications.find((med) => med.id === medicationId);
    if (!medication) return;
    if (newQuantity <= 0) {
      removeFromCart(medicationId);
    } else if (newQuantity > medication.stockQuantity) {
      toast({ title: 'Error', description: `Not enough stock for ${medication.name}`, variant: 'destructive' });
    } else {
      setCart(
        cart.map((item) =>
          item.medication.id === medicationId ? { ...item, quantity: newQuantity } : item,
        ),
      );
    }
  };

  const removeFromCart = (medicationId: number) => {
    setCart(cart.filter((item) => item.medication.id !== medicationId));
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      toast({ title: 'Error', description: 'Cart is empty', variant: 'destructive' });
      return;
    }
    setSaleLoading(true);
    try {
      // Validate stock client-side
      for (const item of cart) {
        const medication = medications.find((med) => med.id === item.medication.id);
        if (!medication || item.quantity > medication.stockQuantity) {
          throw new Error(`Insufficient stock for ${item.medication.name}`);
        }
      }

      // Send POST request to /api/sales
      const response = await axiosInstance.post('api/sales', {
        userId: 1, // Temporary static userId; replace with dynamic userId from auth
        items: cart.map(item => ({
          medicationId: Number(item.medication.id),
          quantity: Number(item.quantity),
          unitPrice: Number(item.medication.price),
        })),
        taxAmount: Number(tax.toFixed(2)),
        discountAmount: Number(discount.toFixed(2)),
      });

      // Clear cart and reset form
      setCart([]);
      toast({ title: 'Success', description: `Sale ${response.data.id} completed with ${cart.length} items` });

      // Refresh stock and sales data
      const [stockRes, salesRes] = await Promise.all([
        axiosInstance.get('api/stock'),
        axiosInstance.get('api/sales'),
      ]);
      
      const medicationsWithStock = stockRes.data.map((stockItem: any) => ({
        id: stockItem.medication.id,
        code: stockItem.medication.code,
        name: stockItem.medication.name,
        description: null,
        dosageForm: '',
        alertLevel: stockItem.medication.alertLevel,
        price: stockItem.medication.price,
        stockQuantity: stockItem.currentQuantity,
        reservedQuantity: stockItem.reservedQuantity,
        family: stockItem.medication.family,
        unit: stockItem.medication.unit,
        familyId: null,
        unitId: null,
      }));
      
      setMedications(medicationsWithStock);
      setSales(salesRes.data);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || err.response?.data?.error || 'Failed to complete sale',
        variant: 'destructive',
      });
    } finally {
      setSaleLoading(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + Number(item.medication.price) * item.quantity, 0);
  const tax = subtotal * 0;
  const discount = 0;
  const total = subtotal + tax - discount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Sale Module</h1>
        <Badge variant="secondary" className="text-sm">
          POS System
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sale" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Sale (POS)
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2">
            <Package className="h-4 w-4" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sale" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-300px)]">
            <div className="lg:col-span-4 space-y-4">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Medications</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="overflow-auto">
                  {loading && <div>Loading...</div>}
                  {error && <div className="text-red-500">Error: {error}</div>}
                  {!loading && !error && (
                    <div className="space-y-2">
                      {filteredMedications.map((medication) => (
                        <div
                          key={medication.id}
                          className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => addToCart(medication)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{medication.name}</p>
                              <p className="text-xs text-muted-foreground">{medication.code}</p>
                              <p className="text-xs text-muted-foreground">{medication.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">{Number(medication.price).toFixed(2)} FBu</p>
                              <Badge variant={medication.stockQuantity < 20 ? 'destructive' : 'secondary'} className="text-xs">
                                {medication.stockQuantity} in stock
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Shopping Cart</CardTitle>
                  <CardDescription>{cart.length} items in cart</CardDescription>
                </CardHeader>
                <CardContent className="overflow-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Cart is empty</p>
                      <p className="text-sm">Add medications from the left panel</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.medication.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.medication.name}</p>
                            <p className="text-xs text-muted-foreground">{Number(item.medication.price).toFixed(2)} FBu each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.medication.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.medication.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{(Number(item.medication.price) * item.quantity).toFixed(2)} FBu</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.medication.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Checkout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{subtotal.toFixed(0)} FBu</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (0%):</span>
                      <span>{tax.toFixed(2)} FBu</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-{discount.toFixed(0)} FBu</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">{total.toFixed(0)} FBu</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={cart.length === 0 || saleLoading}
                    onClick={completeSale}
                  >
                    {saleLoading ? 'Processing...' : 'Complete Sale'}
                  </Button>

                  <Button variant="outline" className="w-full bg-transparent" onClick={() => setCart([])}>
                    Clear Cart
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Medication Stock</CardTitle>
              <CardDescription>View and manage medication inventory</CardDescription>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by family" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Families</SelectItem>
                      {families.map((family) => (
                        <SelectItem key={family.id} value={family.name}>
                          {family.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.name}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading && <div>Loading...</div>}
              {error && <div className="text-red-500">Error: {error}</div>}
              {!loading && !error && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Family</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedications.map((medication) => (
                      <TableRow key={medication.id}>
                        <TableCell className="font-mono">{medication.code}</TableCell>
                        <TableCell className="font-medium">{medication.name}</TableCell>
                        <TableCell>{medication.family}</TableCell>
                        <TableCell>{medication.unit}</TableCell>
                        <TableCell>{Number(medication.price).toFixed(2)} FBu</TableCell>
                        <TableCell>{medication.stockQuantity}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              medication.stockQuantity < 20
                                ? 'destructive'
                                : medication.stockQuantity < 50
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {medication.stockQuantity < 20
                              ? 'Low Stock'
                              : medication.stockQuantity < 50
                              ? 'Medium'
                              : 'In Stock'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Reports</CardTitle>
              <CardDescription>Filter and view sales transaction history</CardDescription>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <Input
                    type="date"
                    className="w-40"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    className="w-40"
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                  />
                </div>
                <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by cashier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cashiers</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.username}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading && <div>Loading...</div>}
              {error && <div className="text-red-500">Error: {error}</div>}
              {!loading && !error && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sale ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Cashier</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono">{sale.id}</TableCell>
                        <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                        <TableCell>{sale.username}</TableCell>
                        <TableCell className="font-bold">{Number(sale.totalAmount).toFixed(2)} FBu</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}