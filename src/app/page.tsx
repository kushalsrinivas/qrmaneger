import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { QRCodeStats } from "@/components/qr-code-stats";
import { RecentQRCodes } from "@/components/recent-qr-codes";
import { AnalyticsChart } from "@/components/analytics-chart";
import { QuickActions } from "@/components/quick-actions";
import { OrganizationSection } from "@/components/organization-section";
import { TopPerformers } from "@/components/top-performers";
import { ProTips } from "@/components/pro-tips";

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex-1 space-y-6 overflow-y-scroll bg-gray-50/30 p-4 pt-6 md:p-8">
      {/* Welcome Header */}
      <DashboardHeader />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense
          fallback={
            <div className="h-24 animate-pulse rounded-lg bg-white"></div>
          }
        >
          <QRCodeStats />
        </Suspense>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column - Main Content */}
        <div className="space-y-6 lg:col-span-4">
          {/* Analytics Chart */}
          <AnalyticsChart
            title="Recent Scan Activity"
            description="Scan trends over the past week"
            data={[
              { name: "Mon", scans: 12, unique: 8 },
              { name: "Tue", scans: 19, unique: 15 },
              { name: "Wed", scans: 8, unique: 6 },
              { name: "Thu", scans: 23, unique: 18 },
              { name: "Fri", scans: 31, unique: 24 },
              { name: "Sat", scans: 15, unique: 12 },
              { name: "Sun", scans: 9, unique: 7 },
            ]}
          />

          {/* Recent Activity */}
          <RecentQRCodes />

          {/* Top Performers */}
          <TopPerformers />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6 lg:col-span-3">
          {/* Quick Actions */}
          <QuickActions />

          {/* Organization */}
          <OrganizationSection />

          {/* Pro Tips */}
          <ProTips />
        </div>
      </div>
    </div>
  );
}
