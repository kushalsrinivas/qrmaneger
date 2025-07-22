"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Eye,
  FileSpreadsheet,
  Package,
  Zap,
  Clock,
  BarChart3,
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";

interface BulkQRCode {
  id: string;
  name: string;
  type: string;
  data: string;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  qrCodeId?: string;
}

export default function BulkPage() {
  const [activeTab, setActiveTab] = useState("create");
  const [selectedQRCodes, setSelectedQRCodes] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [bulkCreateForm, setBulkCreateForm] = useState({
    template: "none",
    folder: "none",
    format: "PNG",
    size: 300,
    errorCorrection: "M",
    data: [] as Array<{ name: string; url: string; description?: string }>,
  });

  const [csvData, setCsvData] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<BulkQRCode[]>([]);

  const [bulkUpdateForm, setBulkUpdateForm] = useState({
    folder: "none",
    tags: "",
    format: "keep",
    size: 0,
    errorCorrection: "",
  });

  const [exportForm, setExportForm] = useState({
    format: "CSV",
    includeAnalytics: true,
    includeImages: false,
    dateRange: "all",
  });

  // tRPC queries and mutations
  const {
    data: bulkOperations,
    isLoading,
    refetch,
  } = api.bulk.listOperations.useQuery({
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data: operationStats } = api.bulk.getStats.useQuery();

  const { data: folders } = api.folders.list.useQuery({
    sortBy: "name",
    sortOrder: "asc",
  });

  const { data: templates } = api.templates.list.useQuery({
    sortBy: "name",
    sortOrder: "asc",
  });

  const bulkCreateMutation = api.bulk.createBatch.useMutation({
    onSuccess: (data) => {
      toast.success(`Bulk operation started: ${data.operationId}`);
      setProcessingStatus(data.qrCodes);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const importCSVMutation = api.bulk.importCSV.useMutation({
    onSuccess: (data) => {
      toast.success(
        `CSV imported successfully: ${data.validRows} rows processed`,
      );
      setBulkCreateForm((prev) => ({ ...prev, data: data.qrCodes }));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const bulkUpdateMutation = api.bulk.updateBatch.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.updatedCount} QR codes updated successfully`);
      setBulkUpdateDialogOpen(false);
      setSelectedQRCodes([]);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const bulkDeleteMutation = api.bulk.deleteBatch.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.deletedCount} QR codes deleted successfully`);
      setIsDeleteDialogOpen(false);
      setSelectedQRCodes([]);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const exportMutation = api.bulk.exportBatch.useMutation({
    onSuccess: (data) => {
      toast.success(`Export completed: ${data.count} records exported`);
      setIsExportDialogOpen(false);
      // In a real app, you'd trigger a download here
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv") {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      setCsvData(csvContent);

      // Parse and validate CSV
      importCSVMutation.mutate({
        csvData: csvContent,
        template: bulkCreateForm.template,
        folder: bulkCreateForm.folder,
      });
    };
    reader.readAsText(file);
  };

  const handleBulkCreate = () => {
    if (bulkCreateForm.data.length === 0) {
      toast.error("Please add QR codes to create");
      return;
    }

    bulkCreateMutation.mutate({
      qrCodes: bulkCreateForm.data,
      template: bulkCreateForm.template,
      folder: bulkCreateForm.folder,
      options: {
        format: bulkCreateForm.format,
        size: bulkCreateForm.size,
        errorCorrection: bulkCreateForm.errorCorrection,
      },
    });
  };

  const handleBulkUpdate = () => {
    if (selectedQRCodes.length === 0) {
      toast.error("Please select QR codes to update");
      return;
    }

    const updates: any = {};
    if (bulkUpdateForm.folder) updates.folderId = bulkUpdateForm.folder;
    if (bulkUpdateForm.tags)
      updates.tags = bulkUpdateForm.tags.split(",").map((t) => t.trim());
    if (bulkUpdateForm.format) updates.format = bulkUpdateForm.format;
    if (bulkUpdateForm.size > 0) updates.size = bulkUpdateForm.size;
    if (bulkUpdateForm.errorCorrection)
      updates.errorCorrection = bulkUpdateForm.errorCorrection;

    bulkUpdateMutation.mutate({
      qrCodeIds: selectedQRCodes,
      updates,
    });
  };

  const handleBulkDelete = () => {
    if (selectedQRCodes.length === 0) {
      toast.error("Please select QR codes to delete");
      return;
    }

    bulkDeleteMutation.mutate({
      qrCodeIds: selectedQRCodes,
    });
  };

  const handleExport = () => {
    exportMutation.mutate({
      format: exportForm.format as "CSV" | "JSON" | "ZIP",
      qrCodeIds: selectedQRCodes.length > 0 ? selectedQRCodes : undefined,
      options: {
        includeAnalytics: exportForm.includeAnalytics,
        includeImages: exportForm.includeImages,
        dateRange: exportForm.dateRange,
      },
    });
  };

  const addQRCodeRow = () => {
    setBulkCreateForm((prev) => ({
      ...prev,
      data: [...prev.data, { name: "", url: "", description: "" }],
    }));
  };

  const removeQRCodeRow = (index: number) => {
    setBulkCreateForm((prev) => ({
      ...prev,
      data: prev.data.filter((_, i) => i !== index),
    }));
  };

  const updateQRCodeRow = (index: number, field: string, value: string) => {
    setBulkCreateForm((prev) => ({
      ...prev,
      data: prev.data.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      processing: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bulk Operations</h2>
          <p className="text-muted-foreground">
            Create, update, and manage QR codes in bulk
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => setBulkUpdateDialogOpen(true)}
            disabled={selectedQRCodes.length === 0}
          >
            <Edit className="mr-2 h-4 w-4" />
            Bulk Update
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={selectedQRCodes.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      </div>

      {/* Stats */}
      {operationStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {operationStats.totalOperations}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                QR Codes Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {operationStats.totalQRCodes}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {operationStats.successRate}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Processing Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {operationStats.avgProcessingTime}s
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Bulk Create</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>CSV Import</CardTitle>
                <CardDescription>
                  Upload a CSV file to create multiple QR codes at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">CSV File</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose CSV File
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    CSV should have columns: name, url, description (optional)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">Template</Label>
                  <Select
                    value={bulkCreateForm.template}
                    onValueChange={(value) =>
                      setBulkCreateForm({ ...bulkCreateForm, template: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No template</SelectItem>
                      {templates?.map((template: any) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="folder">Folder</Label>
                  <Select
                    value={bulkCreateForm.folder}
                    onValueChange={(value) =>
                      setBulkCreateForm({ ...bulkCreateForm, folder: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No folder</SelectItem>
                      {folders?.map((folder: any) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleBulkCreate}
                  disabled={
                    bulkCreateMutation.isPending ||
                    bulkCreateForm.data.length === 0
                  }
                  className="w-full"
                >
                  {bulkCreateMutation.isPending
                    ? "Creating..."
                    : `Create ${bulkCreateForm.data.length} QR Codes`}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manual Entry</CardTitle>
                <CardDescription>
                  Manually enter QR code data for bulk creation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {bulkCreateForm.data.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 items-center gap-2"
                    >
                      <Input
                        placeholder="Name"
                        value={item.name}
                        onChange={(e) =>
                          updateQRCodeRow(index, "name", e.target.value)
                        }
                        className="col-span-4"
                      />
                      <Input
                        placeholder="URL"
                        value={item.url}
                        onChange={(e) =>
                          updateQRCodeRow(index, "url", e.target.value)
                        }
                        className="col-span-6"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeQRCodeRow(index)}
                        className="col-span-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={addQRCodeRow}
                  className="w-full"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Add Row
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <Select
                      value={bulkCreateForm.format}
                      onValueChange={(value) =>
                        setBulkCreateForm({ ...bulkCreateForm, format: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PNG">PNG</SelectItem>
                        <SelectItem value="JPG">JPG</SelectItem>
                        <SelectItem value="SVG">SVG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Input
                      id="size"
                      type="number"
                      value={bulkCreateForm.size}
                      onChange={(e) =>
                        setBulkCreateForm({
                          ...bulkCreateForm,
                          size: parseInt(e.target.value),
                        })
                      }
                      min="100"
                      max="1000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Processing Status */}
          {processingStatus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Status</CardTitle>
                <CardDescription>
                  Real-time status of your bulk operation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {processingStatus.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded border p-2"
                    >
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusBadge(item.status)}>
                          {item.status}
                        </Badge>
                        {item.error && (
                          <span className="text-sm text-red-500">
                            {item.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operation History</CardTitle>
              <CardDescription>
                View your bulk operation history and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex animate-pulse items-center space-x-4"
                    >
                      <div className="bg-muted h-10 w-10 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-muted h-4 w-1/4 rounded"></div>
                        <div className="bg-muted h-3 w-1/6 rounded"></div>
                      </div>
                      <div className="bg-muted h-6 w-20 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : bulkOperations && bulkOperations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operation</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulkOperations.map((operation: any) => (
                      <TableRow key={operation.id}>
                        <TableCell>
                          <div className="font-medium">{operation.name}</div>
                          <div className="text-muted-foreground text-sm">
                            {operation.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{operation.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(operation.status)}
                            <Badge className={getStatusBadge(operation.status)}>
                              {operation.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {operation.totalItems} total
                            <br />
                            <span className="text-green-600">
                              {operation.successCount} success
                            </span>
                            {operation.errorCount > 0 && (
                              <span className="text-red-600">
                                {" "}
                                • {operation.errorCount} errors
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(operation.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center">
                  <BarChart3 className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
                  <h3 className="text-lg font-semibold">No operations yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Start your first bulk operation to see it here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Management</CardTitle>
              <CardDescription>
                Select and manage multiple QR codes at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedQRCodes.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // Select all (you'd get this from your QR codes query)
                          setSelectedQRCodes(["1", "2", "3"]); // Example
                        } else {
                          setSelectedQRCodes([]);
                        }
                      }}
                    />
                    <span className="text-sm font-medium">
                      {selectedQRCodes.length > 0
                        ? `${selectedQRCodes.length} selected`
                        : "Select all"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkUpdateDialogOpen(true)}
                      disabled={selectedQRCodes.length === 0}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Update Selected
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={selectedQRCodes.length === 0}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected
                    </Button>
                  </div>
                </div>

                <div className="text-muted-foreground py-8 text-center">
                  <Package className="mx-auto mb-4 h-16 w-16" />
                  <p>QR codes list would be displayed here</p>
                  <p className="text-sm">With checkboxes for bulk selection</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Update Dialog */}
      <Dialog
        open={bulkUpdateDialogOpen}
        onOpenChange={setBulkUpdateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update QR Codes</DialogTitle>
            <DialogDescription>
              Update {selectedQRCodes.length} selected QR codes
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-folder">Move to Folder</Label>
              <Select
                value={bulkUpdateForm.folder}
                onValueChange={(value) =>
                  setBulkUpdateForm({ ...bulkUpdateForm, folder: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders?.map((folder: any) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-tags">Tags (comma-separated)</Label>
              <Input
                id="bulk-tags"
                value={bulkUpdateForm.tags}
                onChange={(e) =>
                  setBulkUpdateForm({ ...bulkUpdateForm, tags: e.target.value })
                }
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="bulk-format">Format</Label>
                <Select
                  value={bulkUpdateForm.format}
                  onValueChange={(value) =>
                    setBulkUpdateForm({ ...bulkUpdateForm, format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep current</SelectItem>
                    <SelectItem value="PNG">PNG</SelectItem>
                    <SelectItem value="JPG">JPG</SelectItem>
                    <SelectItem value="SVG">SVG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-size">Size</Label>
                <Input
                  id="bulk-size"
                  type="number"
                  value={bulkUpdateForm.size || ""}
                  onChange={(e) =>
                    setBulkUpdateForm({
                      ...bulkUpdateForm,
                      size: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Keep current"
                  min="100"
                  max="1000"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpdate}
              disabled={bulkUpdateMutation.isPending}
            >
              {bulkUpdateMutation.isPending ? "Updating..." : "Update QR Codes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete QR Codes</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedQRCodes.length} selected
              QR codes? This action cannot be undone.
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
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete QR Codes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export QR Codes</DialogTitle>
            <DialogDescription>
              Export your QR codes and data in various formats
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="export-format">Format</Label>
              <Select
                value={exportForm.format}
                onValueChange={(value) =>
                  setExportForm({ ...exportForm, format: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                  <SelectItem value="ZIP">ZIP (with images)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-analytics"
                    checked={exportForm.includeAnalytics}
                    onCheckedChange={(checked) =>
                      setExportForm({
                        ...exportForm,
                        includeAnalytics: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="include-analytics">
                    Include analytics data
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-images"
                    checked={exportForm.includeImages}
                    onCheckedChange={(checked) =>
                      setExportForm({
                        ...exportForm,
                        includeImages: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="include-images">Include QR code images</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select
                value={exportForm.dateRange}
                onValueChange={(value) =>
                  setExportForm({ ...exportForm, dateRange: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exportMutation.isPending}>
              {exportMutation.isPending ? "Exporting..." : "Export Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
