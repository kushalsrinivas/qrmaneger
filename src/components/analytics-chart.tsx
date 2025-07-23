"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Bar,
  BarChart,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface AnalyticsChartProps {
  data?: Array<{
    name: string;
    scans: number;
    unique: number;
  }>;
  title?: string;
  description?: string;
  type?: "line" | "bar" | "area";
  showTrend?: boolean;
  className?: string;
}

export const AnalyticsChart = React.memo<AnalyticsChartProps>(
  function AnalyticsChart({
    data = [],
    title = "Scan Analytics",
    description = "Total vs unique scans over time",
    type = "area",
    showTrend = true,
    className,
  }) {
    // Ensure data is always an array
    const chartData = data || [];

    // Memoize expensive calculations
    const trendData = useMemo(() => {
      const totalScans = chartData.reduce((sum, item) => sum + item.scans, 0);
      const avgScans = totalScans / chartData.length || 0;
      const lastWeekAvg =
        chartData.slice(-3).reduce((sum, item) => sum + item.scans, 0) / 3 || 0;
      const trend = lastWeekAvg > avgScans ? "up" : "down";
      const trendPercentage =
        avgScans > 0
          ? (((lastWeekAvg - avgScans) / avgScans) * 100).toFixed(1)
          : "0";

      return { trend, trendPercentage };
    }, [chartData]);

    const chartConfig = useMemo(
      () => ({
        scans: {
          label: "Total Scans",
          color: "#3b82f6",
        },
        unique: {
          label: "Unique Scans",
          color: "#10b981",
        },
      }),
      [],
    );

    const renderChart = useMemo(() => {
      switch (type) {
        case "bar":
          return (
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="scans" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unique" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          );
        case "line":
          return (
            <LineChart data={chartData}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="scans"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="unique"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          );
        case "area":
        default:
          return (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scansGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="uniqueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="scans"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#scansGradient)"
              />
              <Area
                type="monotone"
                dataKey="unique"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#uniqueGradient)"
              />
            </AreaChart>
          );
      }
    }, [chartData, type]);

    return (
      <Card className={`border-0 shadow-sm ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-lg font-semibold">
                <BarChart3 className="mr-2 h-5 w-5 text-blue-500" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            {showTrend && (
              <div className="flex items-center space-x-2">
                <div
                  className={`flex items-center text-sm font-medium ${
                    trendData.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trendData.trend === "up" ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  {trendData.trendPercentage}%
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart}
            </ResponsiveContainer>
          </ChartContainer>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center space-x-6 border-t border-gray-100 pt-4">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">Total Scans</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Unique Scans</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);
