"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Filter, MoreHorizontal, Eye, Edit, Download, Copy, Trash2, QrCode } from "lucide-react"

const qrCodes = [
  {
    id: 1,
    name: "Product Landing Page",
    type: "URL",
    status: "active",
    scans: 1234,
    uniqueScans: 987,
    created: "2024-01-15",
    lastScan: "2 hours ago",
  },
  {
    id: 2,
    name: "Business Card - John Doe",
    type: "vCard",
    status: "active",
    scans: 567,
    uniqueScans: 432,
    created: "2024-01-14",
    lastScan: "1 day ago",
  },
  {
    id: 3,
    name: "Restaurant Menu",
    type: "PDF",
    status: "paused",
    scans: 890,
    uniqueScans: 654,
    created: "2024-01-12",
    lastScan: "3 days ago",
  },
  {
    id: 4,
    name: "WiFi Access - Office",
    type: "WiFi",
    status: "active",
    scans: 234,
    uniqueScans: 189,
    created: "2024-01-10",
    lastScan: "1 week ago",
  },
  {
    id: 5,
    name: "Event Registration",
    type: "URL",
    status: "expired",
    scans: 456,
    uniqueScans: 321,
    created: "2024-01-08",
    lastScan: "2 weeks ago",
  },
]

export default function CodesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCodes = qrCodes.filter(
    (code) =>
      code.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My QR Codes</h2>
          <p className="text-muted-foreground">Manage and track all your QR codes in one place</p>
        </div>
        <Button>
          <QrCode className="mr-2 h-4 w-4" />
          Create New
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>QR Code Library</CardTitle>
              <CardDescription>{filteredCodes.length} QR codes found</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search QR codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scans</TableHead>
                <TableHead>Unique</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Scan</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-medium">{code.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{code.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        code.status === "active" ? "default" : code.status === "paused" ? "secondary" : "destructive"
                      }
                    >
                      {code.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{code.scans.toLocaleString()}</TableCell>
                  <TableCell>{code.uniqueScans.toLocaleString()}</TableCell>
                  <TableCell>{code.created}</TableCell>
                  <TableCell className="text-muted-foreground">{code.lastScan}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
