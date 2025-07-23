import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Folder } from "lucide-react";

const organizationData = [
  {
    name: "Business Cards",
    count: "2 QR codes",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
  {
    name: "Training Cards",
    count: "0 QR codes",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
  {
    name: "Event Materials",
    count: "1 QR codes",
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  {
    name: "Events & Workshops",
    count: "3 QR codes",
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
  },
  {
    name: "Marketing Campaigns",
    count: "4 QR codes",
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
  },
];

export function OrganizationSection() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-lg font-semibold">
              <span className="mr-2">🗂️</span>
              Organization
            </CardTitle>
            <CardDescription>Manage your QR codes by category</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            View All Folders
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {organizationData.map((item, index) => (
            <div
              key={index}
              className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-50/50 p-3 transition-colors hover:bg-gray-100/50"
            >
              <div className="flex items-center space-x-3">
                <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
                <div className="flex items-center space-x-2">
                  <Folder className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${item.lightColor} ${item.textColor} ${item.borderColor}`}
              >
                {item.count}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
