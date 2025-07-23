import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Crown } from "lucide-react";
import Link from "next/link";

export const DashboardHeader = React.memo(function DashboardHeader() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-8 text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10"></div>
      <div className="absolute top-8 -left-4 h-16 w-16 rounded-full bg-white/5"></div>

      <div className="relative flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to Smart QR Hub
          </h1>
          <p className="max-w-2xl text-lg text-blue-100">
            Create, manage, and track your QR codes with powerful analytics and
            insights.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            asChild
            className="h-auto bg-white px-6 py-2 font-semibold text-blue-600 hover:bg-blue-50"
          >
            <Link href="/generate">
              <Plus className="mr-2 h-4 w-4" />
              Create QR Code
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-auto border-white/30 px-6 py-2 font-semibold text-white hover:bg-white/10"
          >
            <Crown className="mr-2 h-4 w-4" />
            View Pricing
          </Button>
        </div>
      </div>
    </div>
  );
});
