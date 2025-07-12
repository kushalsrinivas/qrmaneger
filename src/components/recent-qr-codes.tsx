import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, MoreHorizontal, QrCode } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const recentCodes = [
  {
    id: 1,
    name: "Product Landing Page",
    type: "URL",
    scans: 1234,
    created: "2 hours ago",
    status: "active",
  },
  {
    id: 2,
    name: "Business Card - John Doe",
    type: "vCard",
    scans: 567,
    created: "1 day ago",
    status: "active",
  },
  {
    id: 3,
    name: "Restaurant Menu",
    type: "PDF",
    scans: 890,
    created: "3 days ago",
    status: "active",
  },
  {
    id: 4,
    name: "WiFi Access",
    type: "WiFi",
    scans: 234,
    created: "1 week ago",
    status: "paused",
  },
  {
    id: 5,
    name: "Event Registration",
    type: "URL",
    scans: 456,
    created: "2 weeks ago",
    status: "active",
  },
]

export function RecentQRCodes() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent QR Codes</CardTitle>
        <CardDescription>Your latest generated QR codes and their performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentCodes.map((code) => (
            <div key={code.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-muted rounded-md">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{code.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">{code.type}</Badge>
                    <span>•</span>
                    <span>{code.created}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  <span>{code.scans}</span>
                </div>
                <Badge variant={code.status === "active" ? "default" : "secondary"}>{code.status}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Download</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
