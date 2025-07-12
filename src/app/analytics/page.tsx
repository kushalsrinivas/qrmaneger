"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis } from "recharts"
import { Download, Filter } from "lucide-react"

const scanData = [
  { date: "2024-01-01", scans: 120, unique: 89 },
  { date: "2024-01-02", scans: 150, unique: 112 },
  { date: "2024-01-03", scans: 180, unique: 134 },
  { date: "2024-01-04", scans: 200, unique: 156 },
  { date: "2024-01-05", scans: 170, unique: 128 },
  { date: "2024-01-06", scans: 220, unique: 167 },
  { date: "2024-01-07", scans: 190, unique: 145 },
]

const deviceData = [
  { name: "Mobile", value: 65, color: "#8884d8" },
  { name: "Desktop", value: 25, color: "#82ca9d" },
  { name: "Tablet", value: 10, color: "#ffc658" },
]

const locationData = [
  { country: "United States", scans: 1200 },
  { country: "United Kingdom", scans: 800 },
  { country: "Canada", scans: 600 },
  { country: "Australia", scans: 400 },
  { country: "Germany", scans: 350 },
]

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">Detailed insights into your QR code performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="7d">
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
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scans">Scan Details</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45,231</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Scans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">32,891</div>
                <p className="text-xs text-muted-foreground">+15.3% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scan Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">72.7%</div>
                <p className="text-xs text-muted-foreground">+2.5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">US</div>
                <p className="text-xs text-muted-foreground">35.2% of total scans</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Scan Trends</CardTitle>
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
                  <LineChart data={scanData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="scans" stroke="var(--color-scans)" strokeWidth={2} />
                    <Line type="monotone" dataKey="unique" stroke="var(--color-unique)" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    mobile: { label: "Mobile", color: "#8884d8" },
                    desktop: { label: "Desktop", color: "#82ca9d" },
                    tablet: { label: "Tablet", color: "#ffc658" },
                  }}
                  className="h-[300px]"
                >
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Locations</CardTitle>
              <CardDescription>Countries with the highest scan activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  scans: {
                    label: "Scans",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[400px]"
              >
                <BarChart data={locationData}>
                  <XAxis dataKey="country" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="scans" fill="var(--color-scans)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
