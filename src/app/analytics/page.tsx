"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Smartphone,
  Globe,
  Calendar,
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [selectedQRCode, setSelectedQRCode] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  // Calculate date range
  const getDateRange = (range: string) => {
    const endDate = new Date();
    const startDate = new Date();

    switch (range) {
      case "24h":
        startDate.setHours(startDate.getHours() - 24);
        break;
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    return { startDate, endDate };
  };

  const currentDateRange = getDateRange(dateRange);

  // tRPC queries
  const { data: overview, isLoading: overviewLoading } =
    api.analytics.getOverview.useQuery({
      dateRange: currentDateRange,
    });

  const { data: timeSeries, isLoading: timeSeriesLoading } =
    api.analytics.getTimeSeries.useQuery({
      dateRange: currentDateRange,
      qrCodeId: selectedQRCode || undefined,
      groupBy:
        dateRange === "24h" ? "day" : dateRange === "7d" ? "day" : "week",
    });

  const { data: deviceAnalytics, isLoading: deviceLoading } =
    api.analytics.getDeviceAnalytics.useQuery({
      dateRange: currentDateRange,
      qrCodeId: selectedQRCode || undefined,
    });

  const { data: locationAnalytics, isLoading: locationLoading } =
    api.analytics.getLocationAnalytics.useQuery({
      dateRange: currentDateRange,
      qrCodeId: selectedQRCode || undefined,
    });

  const { data: performance, isLoading: performanceLoading } =
    api.analytics.getPerformance.useQuery({
      dateRange: currentDateRange,
      limit: 10,
    });

  const { data: realTimeEvents, isLoading: realTimeLoading } =
    api.analytics.getRealTime.useQuery({
      limit: 10,
    });

  // Get QR codes for filter
  const { data: qrCodes } = api.qr.getMyQRCodes.useQuery({
    limit: 100,
  });

  // Export mutation
  const exportMutation = api.analytics.exportData.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Analytics data exported successfully (${data.count} records)`,
      );
      // In a real app, you'd trigger a download here
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleExport = () => {
    exportMutation.mutate({
      format: exportFormat,
      dateRange: currentDateRange,
      qrCodeIds: selectedQRCode ? [selectedQRCode] : undefined,
    });
  };

  // Transform data for charts
  const chartData =
    timeSeries?.map((item) => ({
      date: new Date(item.date as string).toLocaleDateString(),
      scans: item.totalEvents,
      unique: item.uniqueEvents,
    })) || [];

  const deviceChartData =
    deviceAnalytics?.devices?.map((item) => ({
      name: item.device || "Unknown",
      value: item.count,
    })) || [];

  const locationChartData =
    locationAnalytics?.slice(0, 10).map((item) => ({
      name: item.location || "Unknown",
      value: item.count,
    })) || [];

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FFC658",
    "#FF7C7C",
  ];

  if (overviewLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="bg-muted h-4 w-3/4 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-8 w-1/2 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Detailed insights into your QR code performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedQRCode} onValueChange={setSelectedQRCode}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All QR Codes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All QR Codes</SelectItem>
              {qrCodes?.map((qr: any) => (
                <SelectItem key={qr.id} value={qr.id}>
                  {qr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportMutation.isPending ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Eye className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.totalScans?.toLocaleString() || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              {overview?.growthRate !== undefined && (
                <span
                  className={`flex items-center ${overview.growthRate >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {overview.growthRate >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {Math.abs(overview.growthRate).toFixed(1)}% from last period
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Scans</CardTitle>
            <MousePointer className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.uniqueScans?.toLocaleString() || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              {overview?.totalScans &&
                overview.uniqueScans &&
                `${((overview.uniqueScans / overview.totalScans) * 100).toFixed(1)}% unique visitors`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.totalQRCodes || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              {overview?.activeQRCodes} active codes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. per QR</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.averageScansPerQR || 0}
            </div>
            <p className="text-muted-foreground text-xs">scans per QR code</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Scan Activity</CardTitle>
            <CardDescription>
              Daily scan activity over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip />
                  <Line
                    type="monotone"
                    dataKey="scans"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="unique"
                    stroke="#82ca9d"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Scans by device type</CardDescription>
          </CardHeader>
          <CardContent>
            {deviceLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>Countries with the most scans</CardDescription>
          </CardHeader>
          <CardContent>
            {locationLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center justify-between"
                  >
                    <div className="bg-muted h-4 w-1/2 rounded"></div>
                    <div className="bg-muted h-4 w-1/4 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {locationChartData.map((location, index) => (
                  <div
                    key={location.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                      <span className="text-sm">{location.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {location.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing QR Codes</CardTitle>
            <CardDescription>QR codes with the most scans</CardDescription>
          </CardHeader>
          <CardContent>
            {performanceLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center justify-between"
                  >
                    <div className="bg-muted h-4 w-1/2 rounded"></div>
                    <div className="bg-muted h-4 w-1/4 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {performance?.slice(0, 5).map((qr, index) => (
                  <div
                    key={qr.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                        {index + 1}
                      </div>
                      <span className="truncate text-sm">{qr.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {qr.scansInPeriod}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Activity</CardTitle>
          <CardDescription>Recent scan events</CardDescription>
        </CardHeader>
        <CardContent>
          {realTimeLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center justify-between"
                >
                  <div className="bg-muted h-4 w-1/2 rounded"></div>
                  <div className="bg-muted h-4 w-1/4 rounded"></div>
                </div>
              ))}
            </div>
          ) : realTimeEvents && realTimeEvents.length > 0 ? (
            <div className="space-y-2">
              {realTimeEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between border-b py-2 last:border-b-0"
                >
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">{event.qrCodeName}</span>
                    <span className="text-muted-foreground text-xs capitalize">
                      {event.eventType}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <Globe className="mx-auto mb-2 h-8 w-8" />
              <p>No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
