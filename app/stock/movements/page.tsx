"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
    History,
    Search,
    Filter,
    RefreshCw,
    Download,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

interface Movement {
    id: number;
    medicationId: number;
    medicationName: string;
    type: 'sale' | 'purchase' | 'adjustment' | 'loss' | 'return';
    quantity: number;
    referenceId: number | null;
    referenceType: string | null;
    reason: string | null;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export default function StockMovementsPage() {
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
    });

    useEffect(() => {
        fetchMovements();
    }, [pagination.page, pagination.limit, filterType]);

    const fetchMovements = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get("api/stock-movements", {
                params: {
                    page: pagination.page,
                    limit: pagination.limit,
                    type: filterType !== "all" ? filterType : undefined,
                }
            });
            setMovements(response.data.movements);
            setPagination(response.data.pagination);
        } catch (err: any) {
            setError("Failed to fetch movements");
            toast({
                title: "Error",
                description: "Failed to fetch stock movements",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const getMovementBadge = (type: Movement['type']) => {
        switch (type) {
            case 'purchase':
                return <Badge className="bg-green-100 text-green-800 border-green-200">Purchase</Badge>;
            case 'sale':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Sale</Badge>;
            case 'adjustment':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Adjustment</Badge>;
            case 'loss':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Loss</Badge>;
            case 'return':
                return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Return</Badge>;
            default:
                return <Badge>{type}</Badge>;
        }
    };

    const filteredMovements = movements.filter(m =>
        m.medicationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-heading font-bold">Stock Movements</h1>
                </div>
                <Button onClick={fetchMovements} variant="outline" className="gap-2">
                    <RefreshCw className={loading ? "animate-spin h-4 w-4" : "h-4 w-4"} />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{movements.filter(m => m.quantity > 0).length}</div>
                        <p className="text-xs text-muted-foreground">In current view</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Exits</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{movements.filter(m => m.quantity < 0).length}</div>
                        <p className="text-xs text-muted-foreground">In current view</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
                        <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pagination.totalCount}</div>
                        <p className="text-xs text-muted-foreground">All time movements</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Search Medication</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Medication name..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Movement Type</Label>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="purchase">Purchase</SelectItem>
                                    <SelectItem value="sale">Sale</SelectItem>
                                    <SelectItem value="adjustment">Adjustment</SelectItem>
                                    <SelectItem value="loss">Loss</SelectItem>
                                    <SelectItem value="return">Return</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Items per page</Label>
                            <Select
                                value={pagination.limit.toString()}
                                onValueChange={(v) => setPagination({ ...pagination, limit: parseInt(v), page: 1 })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 per page</SelectItem>
                                    <SelectItem value="25">25 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Medication</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Reason</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">Loading movements...</TableCell>
                                </TableRow>
                            ) : filteredMovements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No movements found</TableCell>
                                </TableRow>
                            ) : (
                                filteredMovements.map((movement) => (
                                    <TableRow key={movement.id}>
                                        <TableCell className="text-sm">
                                            {new Date(movement.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="font-medium">{movement.medicationName}</TableCell>
                                        <TableCell>{getMovementBadge(movement.type)}</TableCell>
                                        <TableCell className={`text-right font-bold ${movement.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                                            {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground italic">
                                            {movement.referenceType ? `${movement.referenceType} #${movement.referenceId}` : "-"}
                                        </TableCell>
                                        <TableCell className="text-sm max-w-[200px] truncate" title={movement.reason || ""}>
                                            {movement.reason || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!pagination.hasPrev}
                                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!pagination.hasNext}
                                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
