"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis } from "recharts"

const data = [
  { name: "Jan", scans: 4000, unique: 2400 },
  { name: "Feb", scans: 3000, unique: 1398 },
  { name: "Mar", scans: 2000, unique: 9800 },
  { name: "Apr", scans: 2780, unique: 3908 },
  { name: "May", scans: 1890, unique: 4800 },
  { name: "Jun", scans: 2390, unique: 3800 },
  { name: "Jul", scans: 3490, unique: 4300 },
]

export function AnalyticsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan Analytics</CardTitle>
        <CardDescription>Total vs unique scans over the last 7 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            scans: {
              label: "Total Scans",
              color: "hsl(var(--chart-1))",
            },
            unique: {
              label: "Unique Scans",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px]"
        >
          <LineChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="scans" stroke="var(--color-scans)" strokeWidth={2} />
            <Line type="monotone" dataKey="unique" stroke="var(--color-unique)" strokeWidth={2} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
