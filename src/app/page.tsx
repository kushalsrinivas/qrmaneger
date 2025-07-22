import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { QRCodeStats } from "@/components/qr-code-stats";
import { RecentQRCodes } from "@/components/recent-qr-codes";
import { AnalyticsChart } from "@/components/analytics-chart";
import { QuickActions } from "@/components/quick-actions";

export default function DashboardPage() {
  return (
    <div className="h-screen flex-1 space-y-4 overflow-y-scroll p-4 pt-6 md:p-8">
      <DashboardHeader />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<div>Loading stats...</div>}>
          <QRCodeStats />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
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
        </div>
        <div className="col-span-3">
          <QuickActions />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <RecentQRCodes />
        </div>
        <div className="col-span-3">{/* Additional widgets can go here */}</div>
      </div>
    </div>
  );
}
