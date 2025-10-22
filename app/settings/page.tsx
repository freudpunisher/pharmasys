// components/modules/settings.tsx
'use client';

import { useState, useEffect, JSX } from 'react';
import axiosInstance from '@/lib/axiosInstance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Users, Package, Tag, Scale, Truck, Settings } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

type ResourceType = 'users' | 'medications' | 'families' | 'units' | 'suppliers';

interface ResourceConfig {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'number';
    options?: string[];
    required?: boolean;
  }>;
  tableHeaders: string[];
  tableRender: (item: any) => JSX.Element[];
}

const resourceConfigs: Record<ResourceType, ResourceConfig> = {
  users: {
    title: 'User Management',
    description: 'Manage user accounts and permissions',
    icon: Users,
    fields: [
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'select', options: ['Admin', 'Pharmacist', 'Cashier'], required: true },
    ],
    tableHeaders: ['Username', 'Email', 'Role', 'Status', 'Created At', 'Actions'],
    tableRender: (item) => [
      <TableCell key="username" className="font-mono">{item.username}</TableCell>,
      <TableCell key="email">{item.email}</TableCell>,
      <TableCell key="role">
        <Badge variant={item.role === 'Admin' ? 'default' : 'secondary'}>{item.role}</Badge>
      </TableCell>,
      <TableCell key="status">
        <Badge variant={item.status === 'Active' ? 'default' : 'secondary'}>{item.status || 'Active'}</Badge>
      </TableCell>,
      <TableCell key="createdAt">{new Date(item.createdAt).toLocaleDateString()}</TableCell>,
    ],
  },
  medications: {
    title: 'Medication Management',
    description: 'Manage medication catalog and information',
    icon: Package,
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'dosageForm', label: 'Dosage Form', type: 'select', options: ['Tablet', 'Capsule', 'Syrup', 'Injection'], required: true },
      { name: 'familyId', label: 'Family', type: 'select', required: true },
      { name: 'unitId', label: 'Unit', type: 'select', required: true },
      { name: 'alertLevel', label: 'Alert Level', type: 'number', required: true },
      { name: 'price', label: 'Price', type: 'number', required: true },
      { name: 'stockQuantity', label: 'Stock Quantity', type: 'number', required: true },
    ],
    tableHeaders: ['Code', 'Name', 'Family', 'Unit', 'Alert Level', 'Price', 'Stock', 'Actions'],
    tableRender: (item) => [
      <TableCell key="code" className="font-mono">{item.code}</TableCell>,
      <TableCell key="name" className="font-medium">{item.name}</TableCell>,
      <TableCell key="family">{item.family}</TableCell>,
      <TableCell key="unit">{item.unit}</TableCell>,
      <TableCell key="alertLevel">{item.alertLevel}</TableCell>,
      <TableCell key="price" className="font-bold">{item.price}FBU</TableCell>,
      <TableCell key="stockQuantity">{item.stockQuantity}</TableCell>,
    ],
  },
  families: {
    title: 'Medication Families',
    description: 'Manage medication categories and families',
    icon: Tag,
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
    ],
    tableHeaders: ['Name', 'Created At', 'Actions'],
    tableRender: (item) => [
      <TableCell key="name" className="font-medium">{item.name}</TableCell>,
      <TableCell key="createdAt">{new Date(item.createdAt).toLocaleDateString()}</TableCell>,
    ],
  },
  units: {
    title: 'Units of Measure',
    description: 'Manage measurement units and conversions',
    icon: Scale,
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'conversionRatio', label: 'Conversion Ratio', type: 'number', required: true },
    ],
    tableHeaders: ['Name', 'Conversion Ratio', 'Created At', 'Actions'],
    tableRender: (item) => [
      <TableCell key="name" className="font-medium">{item.name}</TableCell>,
      <TableCell key="conversionRatio">{item.conversionRatio}</TableCell>,
      <TableCell key="createdAt">{new Date(item.createdAt).toLocaleDateString()}</TableCell>,
    ],
  },
  suppliers: {
    title: 'Supplier Management',
    description: 'Manage supplier information and contacts',
    icon: Truck,
    fields: [
      { name: 'name', label: 'Company Name', type: 'text', required: true },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'address', label: 'Address', type: 'textarea' },
    ],
    tableHeaders: ['Company', 'Phone', 'Address', 'Status', 'Created At', 'Actions'],
    tableRender: (item) => [
      <TableCell key="name" className="font-medium">{item.name}</TableCell>,
      <TableCell key="phone">{item.phone}</TableCell>,
      <TableCell key="address">{item.address}</TableCell>,
      <TableCell key="status">
        <Badge variant="default">{item.status || 'Active'}</Badge>
      </TableCell>,
      <TableCell key="createdAt">{new Date(item.createdAt).toLocaleDateString()}</TableCell>,
    ],
  },
};

export default function SettingsModule() {
  const [activeTab, setActiveTab] = useState<ResourceType>('users');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [data, setData] = useState<Record<ResourceType, any[]>>({
    users: [],
    medications: [],
    families: [],
    units: [],
    suppliers: [],
  });
  const [families, setFamilies] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`api/${activeTab}`);
        console.log("response from data ", response);
        setData((prev) => ({ ...prev, [activeTab]: response.data }));
        if (activeTab === 'medications') {
          const [familiesRes, unitsRes] = await Promise.all([
            axiosInstance.get('api/families'),
            axiosInstance.get('api/units'),
          ]);
          setFamilies(familiesRes.data);
          setUnits(unitsRes.data);
        }
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || `Failed to fetch ${activeTab}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await axiosInstance.put(`/api/${activeTab}/${editingItem.id}`, formData);
        toast({ title: `${activeTab.slice(0, -1)} updated successfully` });
      } else {
        await axiosInstance.post(`/api/${activeTab}`, formData);
        toast({ title: `${activeTab.slice(0, -1)} created successfully` });
      }
      const response = await axiosInstance.get(`/api/${activeTab}`);
      setData((prev) => ({ ...prev, [activeTab]: response.data }));
      closeDialog();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || `Failed to ${editingItem ? 'update' : 'create'} ${activeTab.slice(0, -1)}`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) {
      try {
        await axiosInstance.delete(`/api/${activeTab}/${id}`);
        setData((prev) => ({
          ...prev,
          [activeTab]: prev[activeTab].filter((item) => item.id !== id),
        }));
        toast({ title: `${activeTab.slice(0, -1)} deleted successfully` });
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.response?.data?.error || `Failed to delete ${activeTab.slice(0, -1)}`,
          variant: 'destructive',
        });
      }
    }
  };

  const renderDialog = () => {
    const config = resourceConfigs[activeTab];
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={activeTab === 'medications' ? 'max-w-2xl' : ''}>
          <DialogHeader>
            <DialogTitle>{editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}</DialogTitle>
            <DialogDescription>{config.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {config.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label>{field.label}</Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  />
                ) : field.type === 'select' ? (
                  <Select
                    value={formData[field.name]?.toString() || ''}
                    onValueChange={(value) => setFormData({ ...formData, [field.name]: field.name.endsWith('Id') ? Number(value) : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.name === 'familyId' ? (
                        families.map((family) => (
                          <SelectItem key={family.id} value={family.id.toString()}>
                            {family.name}
                          </SelectItem>
                        ))
                      ) : field.name === 'unitId' ? (
                        units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name}
                          </SelectItem>
                        ))
                      ) : (
                        field.options?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.type}
                    step={field.type === 'number' ? '0.01' : undefined}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                  />
                )}
              </div>
            ))}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSubmit} className="flex-1">
                {editingItem ? `Update ${activeTab.slice(0, -1)}` : `Add ${activeTab.slice(0, -1)}`}
              </Button>
              <Button variant="outline" onClick={closeDialog} className="bg-transparent">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const Icon = resourceConfigs[activeTab].icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">System Settings</h1>
        <Badge variant="secondary" className="gap-2">
          <Settings className="h-4 w-4" />
          Configuration
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ResourceType)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="medications" className="gap-2">
            <Package className="h-4 w-4" /> Medications
          </TabsTrigger>
          <TabsTrigger value="families" className="gap-2">
            <Tag className="h-4 w-4" /> Families
          </TabsTrigger>
          <TabsTrigger value="units" className="gap-2">
            <Scale className="h-4 w-4" /> Units
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="h-4 w-4" /> Suppliers
          </TabsTrigger>
        </TabsList>

        {Object.entries(resourceConfigs).map(([key, config]) => (
          <TabsContent key={key} value={key} className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{config.title}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </div>
                <Button onClick={openAddDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add {key.slice(0, -1)}
                </Button>
              </CardHeader>
              <CardContent>
                {loading && <div>Loading...</div>}
                {error && <div className="text-red-500">Error: {error}</div>}
                {!loading && !error && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {config.tableHeaders.map((header) => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data[key as ResourceType]?.map((item) => (
                        <TableRow key={item.id}>
                          {config.tableRender(item)}
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            {renderDialog()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}