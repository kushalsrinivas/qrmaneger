"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  QrCode,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Copy,
  Eye,
  BarChart3,
  Folder,
  Calendar,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Share,
  Plus,
  Grid,
  List,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import Link from "next/link";

export default function CodesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [selectedQRCodes, setSelectedQRCodes] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingQRCode, setDeletingQRCode] = useState<any>(null);

  const limit = 20;

  // tRPC queries and mutations
  const {
    data: qrCodesData,
    isLoading,
    error,
    refetch,
  } = api.qr.getMyQRCodes.useQuery({
    limit,
    offset: (page - 1) * limit,
    search: searchTerm || undefined,
    type: selectedType !== "all" ? selectedType : undefined,
    folderId: selectedFolder !== "all" ? selectedFolder : undefined,
  });

  const { data: folders } = api.folders.list.useQuery({
    sortBy: "name",
    sortOrder: "asc",
  });

  const { data: qrStats } = api.qr.getStats.useQuery();

  const deleteQRCodeMutation = api.qr.delete.useMutation({
    onSuccess: () => {
      toast.success("QR code deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingQRCode(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const duplicateQRCodeMutation = api.qr.create.useMutation({
    onSuccess: () => {
      toast.success("QR code duplicated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const qrCodes = qrCodesData || [];
  const totalPages = Math.ceil((qrStats?.totalQRCodes || 0) / limit);

  const handleDeleteQRCode = (qrCode: any) => {
    setDeletingQRCode(qrCode);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteQRCode = () => {
    if (deletingQRCode) {
      deleteQRCodeMutation.mutate({ id: deletingQRCode.id });
    }
  };

  const handleDuplicateQRCode = (qrCode: any) => {
    duplicateQRCodeMutation.mutate({
      type: qrCode.type,
      name: `${qrCode.name} (Copy)`,
      data: qrCode.data,
      folderId: qrCode.folderId,
      templateId: qrCode.templateId,
    });
  };

  const handleCopyQRCode = (qrCode: any) => {
    const url = `${window.location.origin}/q/${qrCode.shortCode}`;
    navigator.clipboard.writeText(url);
    toast.success("QR code URL copied to clipboard");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "url":
        return <ExternalLink className="h-4 w-4" />;
      case "vcard":
        return <Avatar className="h-4 w-4" />;
      case "wifi":
        return <QrCode className="h-4 w-4" />;
      case "text":
        return <QrCode className="h-4 w-4" />;
      default:
        return <QrCode className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "url":
        return "bg-blue-100 text-blue-800";
      case "vcard":
        return "bg-green-100 text-green-800";
      case "wifi":
        return "bg-purple-100 text-purple-800";
      case "text":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (qrCode: any) => {
    const scansCount = qrCode.scansCount || 0;
    const isActive = qrCode.isActive !== false;

    if (!isActive) {
      return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
    }

    if (scansCount > 100) {
      return <Badge className="bg-green-100 text-green-800">Popular</Badge>;
    }

    if (scansCount > 10) {
      return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
    }

    return <Badge className="bg-gray-100 text-gray-800">New</Badge>;
  };

  const filteredQRCodes = qrCodes.filter((qrCode: any) => {
    const matchesSearch =
      !searchTerm ||
      qrCode.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qrCode.shortCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === "all" || qrCode.type === selectedType;
    const matchesFolder =
      selectedFolder === "all" || qrCode.folderId === selectedFolder;

    return matchesSearch && matchesType && matchesFolder;
  });

  const sortedQRCodes = filteredQRCodes.sort((a: any, b: any) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">QR Codes</h2>
            <p className="text-muted-foreground">Manage your QR codes</p>
          </div>
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-destructive text-lg font-medium">
              Failed to load QR codes
            </p>
            <p className="text-muted-foreground text-sm">{error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">QR Codes</h2>
          <p className="text-muted-foreground">
            Manage and organize your QR codes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <List className="h-4 w-4" />
            ) : (
              <Grid className="h-4 w-4" />
            )}
          </Button>
          <Link href="/generate">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create QR Code
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {qrStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total QR Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qrStats.totalQRCodes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qrStats.totalScans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Active QR Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qrStats.activeQRCodes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Scans per QR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {qrStats.averageScansPerQR}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search QR codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="vcard">vCard</SelectItem>
            <SelectItem value="wifi">WiFi</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Folders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Folders</SelectItem>
            {folders?.map((folder: any) => (
              <SelectItem key={folder.id} value={folder.id}>
                {folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="scansCount">Scans</SelectItem>
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          {sortOrder === "asc" ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* QR Codes */}
      {isLoading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-2"
          }
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="bg-muted h-4 w-3/4 rounded"></div>
                <div className="bg-muted h-3 w-1/2 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted mb-4 h-20 rounded"></div>
                <div className="bg-muted mb-2 h-3 w-full rounded"></div>
                <div className="bg-muted h-3 w-2/3 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedQRCodes.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-4">
          <QrCode className="text-muted-foreground h-16 w-16" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">No QR codes found</h3>
            <p className="text-muted-foreground text-sm">
              {searchTerm || selectedType !== "all" || selectedFolder !== "all"
                ? "Try adjusting your filters"
                : "Create your first QR code to get started"}
            </p>
          </div>
          {!searchTerm &&
            selectedType === "all" &&
            selectedFolder === "all" && (
              <Link href="/generate">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create QR Code
                </Button>
              </Link>
            )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedQRCodes.map((qrCode: any) => (
            <Card key={qrCode.id} className="group relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(qrCode.type)}
                    <CardTitle className="truncate text-lg">
                      {qrCode.name}
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleCopyQRCode(qrCode)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicateQRCode(qrCode)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/l/${qrCode.shortCode}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/generate?edit=${qrCode.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteQRCode(qrCode)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="flex items-center space-x-2">
                  <Badge className={getTypeBadgeColor(qrCode.type)}>
                    {qrCode.type.toUpperCase()}
                  </Badge>
                  {getStatusBadge(qrCode)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted mb-4 flex h-20 items-center justify-center rounded">
                  <QrCode className="text-muted-foreground h-12 w-12" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Scans</span>
                    <span className="font-medium">
                      {qrCode.scansCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {new Date(qrCode.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Short Code</span>
                    <span className="font-mono text-xs">
                      {qrCode.shortCode}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scans</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedQRCodes.map((qrCode: any) => (
                  <TableRow key={qrCode.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="bg-muted flex h-8 w-8 items-center justify-center rounded">
                          <QrCode className="text-muted-foreground h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{qrCode.name}</div>
                          <div className="text-muted-foreground font-mono text-sm">
                            {qrCode.shortCode}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(qrCode.type)}
                        <Badge className={getTypeBadgeColor(qrCode.type)}>
                          {qrCode.type.toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(qrCode)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="text-muted-foreground h-4 w-4" />
                        <span>{qrCode.scansCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(qrCode.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleCopyQRCode(qrCode)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicateQRCode(qrCode)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/l/${qrCode.shortCode}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/generate?edit=${qrCode.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteQRCode(qrCode)}
                            className="text-destructive"
                          >
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
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete QR Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingQRCode?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteQRCode}
              disabled={deleteQRCodeMutation.isPending}
            >
              {deleteQRCodeMutation.isPending
                ? "Deleting..."
                : "Delete QR Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
