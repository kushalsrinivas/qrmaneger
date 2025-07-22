"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  Download,
  Eye,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Globe,
  Smartphone,
  Activity,
  MapPin,
  Monitor,
  Tablet,
  Zap,
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [selectedQRCode, setSelectedQRCode] = useState<string>("all");

  // Memoize date range calculation to prevent infinite re-renders
  const currentDateRange = useMemo(() => {
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

    return getDateRange(dateRange);
  }, [dateRange]);

  // Memoize query inputs to prevent recreation on every render
  const overviewInput = useMemo(
    () => ({
      dateRange: currentDateRange,
    }),
    [currentDateRange],
  );

  const deviceAnalyticsInput = useMemo(
    () => ({
      dateRange: currentDateRange,
      qrCodeId: selectedQRCode === "all" ? undefined : selectedQRCode,
    }),
    [currentDateRange, selectedQRCode],
  );

  const locationAnalyticsInput = useMemo(
    () => ({
      dateRange: currentDateRange,
      qrCodeId: selectedQRCode === "all" ? undefined : selectedQRCode,
    }),
    [currentDateRange, selectedQRCode],
  );

  const performanceInput = useMemo(
    () => ({
      dateRange: currentDateRange,
      limit: 10,
    }),
    [currentDateRange],
  );

  const realTimeInput = useMemo(
    () => ({
      limit: 10,
    }),
    [],
  );

  const qrCodesInput = useMemo(
    () => ({
      limit: 100,
    }),
    [],
  );

  const queryOptions = useMemo(
    () => ({
      staleTime: 10 * 60 * 1000, // Data stays fresh for 10 mins
      refetchInterval: 10 * 60 * 1000, // Refetch automatically every 10 mins
    }),
    [],
  );

  // tRPC queries
  const { data: overview, isLoading: overviewLoading } =
    api.analytics.getOverview.useQuery(overviewInput, queryOptions);

  const { data: deviceAnalytics, isLoading: deviceLoading } =
    api.analytics.getDeviceAnalytics.useQuery(
      deviceAnalyticsInput,
      queryOptions,
    );

  const { data: locationAnalytics, isLoading: locationLoading } =
    api.analytics.getLocationAnalytics.useQuery(
      locationAnalyticsInput,
      queryOptions,
    );

  const { data: performance, isLoading: performanceLoading } =
    api.analytics.getPerformance.useQuery(performanceInput, queryOptions);

  const { data: realTimeEvents, isLoading: realTimeLoading } =
    api.analytics.getRealTime.useQuery(realTimeInput, queryOptions);

  // Get QR codes for filter
  const { data: qrCodes } = api.qr.getMyQRCodes.useQuery(
    qrCodesInput,
    queryOptions,
  );

  // Export mutation
  const exportMutation = api.analytics.exportData.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Analytics data exported successfully (${data.count} records)`,
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleExport = useCallback(() => {
    exportMutation.mutate({
      format: "csv",
      dateRange: currentDateRange,
      qrCodeIds: selectedQRCode !== "all" ? [selectedQRCode] : undefined,
    });
  }, [exportMutation, currentDateRange, selectedQRCode]);

  // Transform data for charts
  const deviceChartData =
    deviceAnalytics?.devices?.map((item) => ({
      name: item.device ?? "Unknown",
      value: item.count,
    })) ?? [];

  const locationChartData =
    locationAnalytics?.slice(0, 10).map((item) => ({
      name: item.location ?? "Unknown",
      value: item.count,
    })) ?? [];

  // Calculate metrics
  const totalScans = overview?.totalScans ?? 0;
  const uniqueVisitors = overview?.uniqueScans ?? 0;
  const activeQRCodes = overview?.activeQRCodes ?? 0;
  const totalQRCodes = overview?.totalQRCodes ?? 0;
  const growthRate = overview?.growthRate ?? 0;

  // Calculate average daily scans
  const daysInRange =
    dateRange === "24h"
      ? 1
      : dateRange === "7d"
        ? 7
        : dateRange === "30d"
          ? 30
          : 90;
  const avgDailyScans = Math.round(totalScans / daysInRange);

  if (overviewLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Analytics Dashboard
            </h2>
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
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Track performance and insights for your QR codes
          </p>
        </div>
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Last 7 days" />
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
              <SelectItem value="all">All QR Codes</SelectItem>
              {qrCodes?.map((qr) => (
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
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Scans
            </CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalScans.toLocaleString()}
            </div>
            <p className="text-muted-foreground mt-1 flex items-center text-xs">
              {growthRate !== 0 && (
                <span
                  className={`flex items-center ${growthRate >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {growthRate >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {Math.abs(growthRate).toFixed(0)}% from last period
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Unique Visitors
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uniqueVisitors.toLocaleString()}
            </div>
            <p className="text-muted-foreground mt-1 flex items-center text-xs">
              {totalScans > 0 && (
                <span className="flex items-center text-green-600">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {Math.round((uniqueVisitors / totalScans) * 100)}% from last
                  period
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Active QR Codes
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeQRCodes}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              out of {totalQRCodes} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Avg. Daily Scans
            </CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDailyScans}</div>
            <p className="text-muted-foreground mt-1 flex items-center text-xs">
              <span className="flex items-center text-orange-600">
                <TrendingUp className="mr-1 h-3 w-3" />
                +15% trend
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Performing QR Codes */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg font-semibold">
                Top Performing QR Codes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {performanceLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
              </div>
            ) : performance && performance.length > 0 ? (
              <div className="space-y-4">
                {performance.slice(0, 5).map((qr, index) => (
                  <div
                    key={qr.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{qr.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {qr.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{qr.scansInPeriod}</p>
                      <p className="text-muted-foreground text-xs">scans</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-center">
                <div className="text-muted-foreground">
                  <BarChart3 className="mx-auto mb-2 h-8 w-8" />
                  <p>No scan data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg font-semibold">
                Geographic Distribution
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {locationLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
              </div>
            ) : locationChartData.length > 0 ? (
              <div className="space-y-4">
                {locationChartData.slice(0, 5).map((location, index) => (
                  <div
                    key={location.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <MapPin className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm font-medium">
                        {location.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-muted h-2 w-20 rounded-full">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{
                            width: `${(location.value / (locationChartData[0]?.value ?? 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-semibold">
                        {location.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-center">
                <div className="text-muted-foreground">
                  <MapPin className="mx-auto mb-2 h-8 w-8" />
                  <p>No location data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Device Types */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg font-semibold">
                Device Types
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {deviceLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
              </div>
            ) : deviceChartData.length > 0 ? (
              <div className="space-y-4">
                {deviceChartData.map((device, index) => {
                  const getDeviceIcon = (deviceType: string) => {
                    switch (deviceType.toLowerCase()) {
                      case "mobile":
                        return <Smartphone className="h-4 w-4" />;
                      case "tablet":
                        return <Tablet className="h-4 w-4" />;
                      case "desktop":
                        return <Monitor className="h-4 w-4" />;
                      default:
                        return <Monitor className="h-4 w-4" />;
                    }
                  };

                  return (
                    <div
                      key={device.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-muted-foreground">
                          {getDeviceIcon(device.name)}
                        </div>
                        <span className="text-sm font-medium capitalize">
                          {device.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="bg-muted h-2 w-16 rounded-full">
                          <div
                            className="h-2 rounded-full bg-purple-500"
                            style={{
                              width: `${(device.value / (deviceChartData[0]?.value ?? 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-sm font-semibold">
                          {device.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-center">
                <div className="text-muted-foreground">
                  <Smartphone className="mx-auto mb-2 h-8 w-8" />
                  <p>No device data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg font-semibold">
                Recent Activity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {realTimeLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
              </div>
            ) : realTimeEvents && realTimeEvents.length > 0 ? (
              <div className="space-y-3">
                {realTimeEvents.slice(0, 6).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <div>
                        <p className="text-sm font-medium">
                          {event.qrCodeName}
                        </p>
                        <p className="text-muted-foreground text-xs capitalize">
                          {event.eventType}
                        </p>
                      </div>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-center">
                <div className="text-muted-foreground">
                  <Activity className="mx-auto mb-2 h-8 w-8" />
                  <p>No recent activity</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
