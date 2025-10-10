import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { TrendingDown, DollarSign, AlertTriangle, Calendar } from "lucide-react";

interface Loss {
  id: number;
  quantity: number;
  reason: string;
  value: string;
  lossDate: string;
  medicationName: string;
  username: string;
  status: string;
}

interface Medication {
  id: number;
  code: string;
  name: string;
  price: string;
  stockQuantity: number;
}

export default function LossModule() {
  const router = useRouter();
  const [losses, setLosses] = useState<Loss[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalLosses: 0,
    lossValue: 0,
    mostCommonReason: "N/A",
    pendingCount: 0,
  });

  useEffect(() => {
    const fetchLosses = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("api/losses");
        const lossesData: Loss[] = response.data;
        const totalLosses = lossesData.length;
        const lossValue = lossesData.reduce((sum, loss) => sum + Number(loss.value), 0);
        const reasons = lossesData.reduce((acc, loss) => {
          acc[loss.reason] = (acc[loss.reason] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const mostCommonReason = Object.entries(reasons).reduce((a, b) => (b[1] > a[1] ? b : a), ["N/A", 0])[0];
        const pendingCount = lossesData.filter((loss) => loss.status === "Pending").length;

        setLosses(lossesData);
        setStats({ totalLosses, lossValue, mostCommonReason, pendingCount });
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch losses");
        toast({
          title: "Error",
          description: err.response?.data?.error || "Failed to fetch losses",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchLosses();
  }, []);

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "Expired":
        return "bg-orange-100 text-orange-800";
      case "Damaged":
        return "bg-red-100 text-red-800";
      case "Theft":
        return "bg-purple-100 text-purple-800";
      case "Breakage":
        return "bg-yellow-100 text-yellow-800";
      case "Contamination":
        return "bg-red-100 text-red-800";
      case "Recall":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Loss Management</h1>
        <Button onClick={() => router.push("/losses/new")} className="gap-2">
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
          <CardTitle>Loss History</CardTitle>
          <CardDescription>Track all medication losses and their reasons</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500">Error: {error}</div>}
          {!loading && !error && (
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {losses.map((loss) => (
                  <TableRow key={loss.id}>
                    <TableCell
                      className="font-mono cursor-pointer text-blue-600 hover:underline"
                      onClick={() => router.push(`/losses/${loss.id}`)}
                    >
                      {loss.id}
                    </TableCell>
                    <TableCell>{new Date(loss.lossDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{loss.medicationName}</TableCell>
                    <TableCell>{loss.quantity}</TableCell>
                    <TableCell>
                      <Badge className={getReasonColor(loss.reason)}>{loss.reason}</Badge>
                    </TableCell>
                    <TableCell className="font-bold text-destructive">${Number(loss.value).toFixed(2)}</TableCell>
                    <TableCell>{loss.username}</TableCell>
                    <TableCell>
                      <Badge variant={loss.status === "Approved" ? "default" : "secondary"}>{loss.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}