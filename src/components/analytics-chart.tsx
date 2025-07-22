"use client";

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
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AnalyticsChartProps {
  data?: Array<{
    name: string;
    scans: number;
    unique: number;
  }>;
  title?: string;
  description?: string;
  type?: "line" | "bar";
  showTrend?: boolean;
  className?: string;
}

export function AnalyticsChart({
  data = [],
  title = "Scan Analytics",
  description = "Total vs unique scans over time",
  type = "line",
  showTrend = true,
  className,
}: AnalyticsChartProps) {
  // Ensure data is always an array
  const chartData = data || [];

  // Calculate trend
  const totalScans = chartData.reduce((sum, item) => sum + item.scans, 0);
  const avgScans = chartData.length > 0 ? totalScans / chartData.length : 0;
  const lastValue = chartData[chartData.length - 1]?.scans ?? 0;
  const trend = lastValue > avgScans;

  const chartConfig = {
    scans: {
      label: "Total Scans",
      color: "hsl(var(--chart-1))",
    },
    unique: {
      label: "Unique Scans",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showTrend && (
            <div
              className={`flex items-center space-x-1 text-sm ${trend ? "text-green-600" : "text-red-600"}`}
            >
              {trend ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{trend ? "Trending up" : "Trending down"}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {type === "line" ? (
              <LineChart data={chartData}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <YAxis axisLine={false} tickLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="scans"
                  stroke="var(--color-scans)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-scans)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="unique"
                  stroke="var(--color-unique)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-unique)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <YAxis axisLine={false} tickLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="scans"
                  fill="var(--color-scans)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="unique"
                  fill="var(--color-unique)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
