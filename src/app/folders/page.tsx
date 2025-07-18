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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FolderOpen,
  FolderPlus,
  MoreHorizontal,
  QrCode,
  Edit,
  Trash2,
  Move,
  Share,
  Search,
  ChevronRight,
  Home,
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export default function FoldersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [movingFolder, setMovingFolder] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    parentId: null as string | null,
  });

  // tRPC queries and mutations
  const {
    data: folders,
    isLoading,
    error,
    refetch,
  } = api.folders.list.useQuery({
    parentId: selectedFolder,
    includeQRCodes: true,
    sortBy: "name",
    sortOrder: "asc",
  });

  const { data: folderTree } = api.folders.getTree.useQuery();
  const { data: folderStats } = api.folders.getStats.useQuery();

  const createFolderMutation = api.folders.create.useMutation({
    onSuccess: () => {
      toast.success("Folder created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateFolderMutation = api.folders.update.useMutation({
    onSuccess: () => {
      toast.success("Folder updated successfully");
      setIsEditDialogOpen(false);
      setEditingFolder(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteFolderMutation = api.folders.delete.useMutation({
    onSuccess: () => {
      toast.success("Folder deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const moveFolderMutation = api.folders.move.useMutation({
    onSuccess: () => {
      toast.success("Folder moved successfully");
      setIsMoveDialogOpen(false);
      setMovingFolder(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6",
      parentId: selectedFolder,
    });
  };

  const handleCreateFolder = () => {
    createFolderMutation.mutate({
      name: formData.name,
      description: formData.description,
      color: formData.color,
      parentId: formData.parentId,
    });
  };

  const handleUpdateFolder = () => {
    if (!editingFolder) return;
    updateFolderMutation.mutate({
      id: editingFolder.id,
      name: formData.name,
      description: formData.description,
      color: formData.color,
    });
  };

  const handleEditFolder = (folder: any) => {
    setEditingFolder(folder);
    setFormData({
      name: folder.name,
      description: folder.description || "",
      color: folder.color || "#3b82f6",
      parentId: folder.parentId,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteFolder = (folderId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this folder? QR codes will be moved to the parent folder.",
      )
    ) {
      deleteFolderMutation.mutate({
        id: folderId,
        moveQRCodesToParent: true,
      });
    }
  };

  const handleMoveFolder = (folder: any) => {
    setMovingFolder(folder);
    setIsMoveDialogOpen(true);
  };

  const handleMoveFolderConfirm = (targetParentId: string | null) => {
    if (!movingFolder) return;
    moveFolderMutation.mutate({
      id: movingFolder.id,
      parentId: targetParentId,
    });
  };

  const navigateToFolder = (folderId: string | null) => {
    setSelectedFolder(folderId);
  };

  const getBreadcrumbs = () => {
    if (!selectedFolder || !folderTree) return [];

    const findPath = (
      folders: any[],
      targetId: string,
      path: any[] = [],
    ): any[] => {
      for (const folder of folders) {
        const newPath = [...path, folder];
        if (folder.id === targetId) {
          return newPath;
        }
        if (folder.children) {
          const result = findPath(folder.children, targetId, newPath);
          if (result.length > 0) return result;
        }
      }
      return [];
    };

    return findPath(folderTree, selectedFolder);
  };

  const breadcrumbs = getBreadcrumbs();

  const filteredFolders =
    folders?.filter((folder: any) =>
      folder.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Folders</h2>
            <p className="text-muted-foreground">
              Manage your folder structure
            </p>
          </div>
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-destructive text-lg font-medium">
              Failed to load folders
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
          <h2 className="text-3xl font-bold tracking-tight">Folders</h2>
          <p className="text-muted-foreground">
            Organize your QR codes with folders
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <FolderPlus className="mr-2 h-4 w-4" />
          Create Folder
        </Button>
      </div>

      {/* Stats */}
      {folderStats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Folders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {folderStats.totalFolders}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Root Folders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {folderStats.rootFolders}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Max Depth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {folderStats.deepestLevel}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="text-muted-foreground flex items-center space-x-2 text-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateToFolder(null)}
          className="h-8 px-2"
        >
          <Home className="mr-1 h-4 w-4" />
          Root
        </Button>
        {breadcrumbs.map((folder, index) => (
          <div key={folder.id} className="flex items-center">
            <ChevronRight className="mx-1 h-4 w-4" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateToFolder(folder.id)}
              className="h-8 px-2"
            >
              {folder.name}
            </Button>
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex items-center space-x-2">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
        >
          {viewMode === "grid" ? "List" : "Grid"}
        </Button>
      </div>

      {/* Folders */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="bg-muted h-4 w-3/4 rounded"></div>
                <div className="bg-muted h-3 w-1/2 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted mb-2 h-3 w-full rounded"></div>
                <div className="bg-muted h-3 w-2/3 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredFolders.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-4">
          <FolderOpen className="text-muted-foreground h-16 w-16" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">No folders found</h3>
            <p className="text-muted-foreground text-sm">
              {searchTerm
                ? "Try adjusting your search"
                : selectedFolder
                  ? "This folder is empty"
                  : "Create your first folder to get started"}
            </p>
          </div>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Create Folder
            </Button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-2"
          }
        >
          {filteredFolders.map((folder: any) => (
            <Card
              key={folder.id}
              className={`group relative ${viewMode === "list" ? "flex items-center p-4" : ""}`}
            >
              {viewMode === "grid" ? (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-4 w-4 rounded"
                          style={{ backgroundColor: folder.color || "#3b82f6" }}
                        />
                        <CardTitle className="text-lg">{folder.name}</CardTitle>
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
                            onClick={() => navigateToFolder(folder.id)}
                          >
                            <FolderOpen className="mr-2 h-4 w-4" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditFolder(folder)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleMoveFolder(folder)}
                          >
                            <Move className="mr-2 h-4 w-4" />
                            Move
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription>{folder.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <QrCode className="h-4 w-4" />
                        <span>{folder.qrCodesCount || 0} QR codes</span>
                      </div>
                      <span>
                        {new Date(folder.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: folder.color || "#3b82f6" }}
                    />
                    <div>
                      <h3 className="font-medium">{folder.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {folder.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-muted-foreground text-sm">
                      {folder.qrCodesCount || 0} QR codes
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigateToFolder(folder.id)}
                        >
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditFolder(folder)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleMoveFolder(folder)}
                        >
                          <Move className="mr-2 h-4 w-4" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteFolder(folder.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your QR codes
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Folder Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter folder name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter folder description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>Update the folder details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Folder Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter folder name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter folder description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateFolder}
              disabled={updateFolderMutation.isPending}
            >
              {updateFolderMutation.isPending ? "Updating..." : "Update Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Folder Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Folder</DialogTitle>
            <DialogDescription>
              Select the destination for "{movingFolder?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleMoveFolderConfirm(null)}
              >
                <Home className="mr-2 h-4 w-4" />
                Root (No parent)
              </Button>
              {folderTree?.map((folder: any) => (
                <div key={folder.id} className="space-y-1">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleMoveFolderConfirm(folder.id)}
                    disabled={folder.id === movingFolder?.id}
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    {folder.name}
                  </Button>
                  {folder.children?.map((child: any) => (
                    <Button
                      key={child.id}
                      variant="outline"
                      className="ml-4 w-full justify-start"
                      onClick={() => handleMoveFolderConfirm(child.id)}
                      disabled={child.id === movingFolder?.id}
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      {child.name}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMoveDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
