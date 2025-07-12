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
} from "lucide-react";

const folders = [
  {
    id: 1,
    name: "Marketing Campaigns",
    description: "QR codes for marketing materials",
    qrCount: 45,
    created: "2024-01-15",
    color: "blue",
  },
  {
    id: 2,
    name: "Product Catalogs",
    description: "Product-related QR codes",
    qrCount: 32,
    created: "2024-01-12",
    color: "green",
  },
  {
    id: 3,
    name: "Business Cards",
    description: "vCard QR codes for team members",
    qrCount: 18,
    created: "2024-01-10",
    color: "purple",
  },
  {
    id: 4,
    name: "Event Materials",
    description: "QR codes for events and conferences",
    qrCount: 27,
    created: "2024-01-08",
    color: "orange",
  },
  {
    id: 5,
    name: "Restaurant Menus",
    description: "Digital menu QR codes",
    qrCount: 12,
    created: "2024-01-05",
    color: "red",
  },
];

export default function FoldersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");

  const handleCreateFolder = () => {
    // Handle folder creation logic here
    setIsCreateDialogOpen(false);
    setNewFolderName("");
    setNewFolderDescription("");
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Folders</h2>
          <p className="text-muted-foreground">
            Organize your QR codes into folders for better management
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Create a new folder to organize your QR codes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  placeholder="Enter folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="folder-description">
                  Description (Optional)
                </Label>
                <Input
                  id="folder-description"
                  placeholder="Enter folder description"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
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
              <Button onClick={handleCreateFolder}>Create Folder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <Card
            key={folder.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`rounded-lg p-2 bg-${folder.color}-100`}>
                    <FolderOpen
                      className={`h-5 w-5 text-${folder.color}-600`}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{folder.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {folder.description}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Move className="mr-2 h-4 w-4" />
                      Move
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <QrCode className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-sm">
                    {folder.qrCount} QR codes
                  </span>
                </div>
                <Badge variant="secondary">{folder.created}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest changes in your folders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: "Created folder",
                folder: "Marketing Campaigns",
                time: "2 hours ago",
              },
              {
                action: "Moved 5 QR codes to",
                folder: "Product Catalogs",
                time: "1 day ago",
              },
              {
                action: "Renamed folder",
                folder: "Business Cards",
                time: "3 days ago",
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>
                  {activity.action} <strong>{activity.folder}</strong>
                </span>
                <span className="text-muted-foreground ml-auto">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
