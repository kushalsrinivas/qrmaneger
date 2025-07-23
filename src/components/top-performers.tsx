import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Crown, Link } from "lucide-react";

const topPerformers = [
  {
    id: 1,
    name: "Product Demo Video",
    type: "URL",
    scans: 1247,
    maxScans: 1500,
    growth: "+12%",
    performance: 83,
    rank: 1,
  },
  {
    id: 2,
    name: "Business Card",
    type: "vCard",
    scans: 892,
    maxScans: 1500,
    growth: "+8%",
    performance: 59,
    rank: 2,
  },
  {
    id: 3,
    name: "Restaurant Menu",
    type: "PDF",
    scans: 634,
    maxScans: 1500,
    growth: "+15%",
    performance: 42,
    rank: 3,
  },
];

export function TopPerformers() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-lg font-semibold">
              <Crown className="mr-2 h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Your best performing QR codes this month
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {topPerformers.map((item) => (
            <div key={item.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-bold text-white">
                    #{item.rank}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                      <Link className="h-3 w-3" />
                      <span>{item.scans.toLocaleString()} scans</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-sm font-medium text-green-600">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {item.growth}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>Performance</span>
                  <span>{item.performance}%</span>
                </div>
                <Progress value={item.performance} className="h-2" />
              </div>
              {item.id < topPerformers.length && (
                <div className="border-b border-gray-100"></div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
