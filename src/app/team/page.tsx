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
  UserPlus,
  MoreHorizontal,
  Mail,
  Shield,
  Users,
  Crown,
  Edit,
  Trash2,
  Search,
  Building,
  Settings,
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreateOrgDialogOpen, setIsCreateOrgDialogOpen] = useState(false);
  const [isEditMemberDialogOpen, setIsEditMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [page, setPage] = useState(1);

  // Form state
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member" as const,
    permissions: {
      canCreateQR: true,
      canEditQR: true,
      canDeleteQR: false,
      canViewAnalytics: true,
      canManageUsers: false,
      canManageSettings: false,
    },
  });

  const [orgForm, setOrgForm] = useState({
    name: "",
    description: "",
    website: "",
  });

  const [memberEditForm, setMemberEditForm] = useState({
    role: "member" as const,
    permissions: {
      canCreateQR: true,
      canEditQR: true,
      canDeleteQR: false,
      canViewAnalytics: true,
      canManageUsers: false,
      canManageSettings: false,
    },
  });

  // tRPC queries and mutations
  const { data: organizations } = api.team.getUserOrganizations.useQuery();

  const {
    data: membersData,
    isLoading,
    error,
    refetch,
  } = api.team.listMembers.useQuery(
    {
      organizationId: selectedOrg || organizations?.[0]?.id || "",
      page,
      limit: 10,
      search: searchTerm || undefined,
      role: selectedRole || undefined,
      sortBy: "name",
      sortOrder: "asc",
    },
    {
      enabled: !!(selectedOrg || organizations?.[0]?.id),
    },
  );

  const { data: orgStats } = api.team.getOrganizationStats.useQuery(
    {
      organizationId: selectedOrg || organizations?.[0]?.id || "",
    },
    {
      enabled: !!(selectedOrg || organizations?.[0]?.id),
    },
  );

  const createOrgMutation = api.team.createOrganization.useMutation({
    onSuccess: () => {
      toast.success("Organization created successfully");
      setIsCreateOrgDialogOpen(false);
      resetOrgForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const inviteMemberMutation = api.team.inviteMember.useMutation({
    onSuccess: () => {
      toast.success("Member invited successfully");
      setIsInviteDialogOpen(false);
      resetInviteForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMemberMutation = api.team.updateMember.useMutation({
    onSuccess: () => {
      toast.success("Member updated successfully");
      setIsEditMemberDialogOpen(false);
      setEditingMember(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeMemberMutation = api.team.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetInviteForm = () => {
    setInviteForm({
      email: "",
      role: "member",
      permissions: {
        canCreateQR: true,
        canEditQR: true,
        canDeleteQR: false,
        canViewAnalytics: true,
        canManageUsers: false,
        canManageSettings: false,
      },
    });
  };

  const resetOrgForm = () => {
    setOrgForm({
      name: "",
      description: "",
      website: "",
    });
  };

  const handleInviteMember = () => {
    if (!selectedOrg && !organizations?.[0]?.id) {
      toast.error("Please select an organization");
      return;
    }

    inviteMemberMutation.mutate({
      organizationId: selectedOrg || organizations?.[0]?.id || "",
      email: inviteForm.email,
      role: inviteForm.role,
      permissions: inviteForm.permissions,
    });
  };

  const handleCreateOrganization = () => {
    createOrgMutation.mutate({
      name: orgForm.name,
      description: orgForm.description,
      website: orgForm.website,
    });
  };

  const handleEditMember = (member: any) => {
    setEditingMember(member);
    setMemberEditForm({
      role: member.role,
      permissions: member.permissions || {
        canCreateQR: true,
        canEditQR: true,
        canDeleteQR: false,
        canViewAnalytics: true,
        canManageUsers: false,
        canManageSettings: false,
      },
    });
    setIsEditMemberDialogOpen(true);
  };

  const handleUpdateMember = () => {
    if (!editingMember) return;

    updateMemberMutation.mutate({
      memberId: editingMember.id,
      role: memberEditForm.role,
      permissions: memberEditForm.permissions,
    });
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      removeMemberMutation.mutate({ memberId });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "team_lead":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "member":
        return <Users className="h-4 w-4 text-green-500" />;
      case "viewer":
        return <Mail className="h-4 w-4 text-gray-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-yellow-100 text-yellow-800";
      case "team_lead":
        return "bg-blue-100 text-blue-800";
      case "member":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const currentOrg = selectedOrg
    ? organizations?.find((org) => org.id === selectedOrg)
    : organizations?.[0];

  const members = membersData?.members || [];
  const pagination = membersData?.pagination;

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Team</h2>
            <p className="text-muted-foreground">Manage your team members</p>
          </div>
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-destructive text-lg font-medium">
              Failed to load team data
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
          <h2 className="text-3xl font-bold tracking-tight">Team</h2>
          <p className="text-muted-foreground">
            Manage your team members and organization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsCreateOrgDialogOpen(true)}
          >
            <Building className="mr-2 h-4 w-4" />
            New Organization
          </Button>
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Organization selector */}
      {organizations && organizations.length > 1 && (
        <div className="flex items-center space-x-2">
          <Label htmlFor="org-select">Organization:</Label>
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Stats */}
      {orgStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orgStats.totalMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orgStats.membersByRole.admin || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Team Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orgStats.membersByRole.team_lead || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orgStats.membersByRole.member || 0}
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
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="team_lead">Team Lead</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your organization's team members and their permissions
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
                  <div className="bg-muted h-10 w-10 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted h-4 w-1/4 rounded"></div>
                    <div className="bg-muted h-3 w-1/6 rounded"></div>
                  </div>
                  <div className="bg-muted h-6 w-20 rounded"></div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
              <h3 className="text-lg font-semibold">No team members found</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm
                  ? "Try adjusting your search"
                  : "Invite your first team member to get started"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={member.image} alt={member.name} />
                          <AvatarFallback>
                            {member.name?.charAt(0).toUpperCase() ||
                              member.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {member.name || "No name"}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(member.role)}
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role.replace("_", " ")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditMember(member)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
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
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Invite a new member to join your organization
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value: any) =>
                  setInviteForm({ ...inviteForm, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="team_lead">Team Lead</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                {Object.entries(inviteForm.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={value}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          permissions: {
                            ...inviteForm.permissions,
                            [key]: e.target.checked,
                          },
                        })
                      }
                    />
                    <Label htmlFor={key} className="text-sm">
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInviteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={inviteMemberMutation.isPending}
            >
              {inviteMemberMutation.isPending
                ? "Inviting..."
                : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Organization Dialog */}
      <Dialog
        open={isCreateOrgDialogOpen}
        onOpenChange={setIsCreateOrgDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to manage your team
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={orgForm.name}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, name: e.target.value })
                }
                placeholder="Enter organization name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-description">Description</Label>
              <Textarea
                id="org-description"
                value={orgForm.description}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, description: e.target.value })
                }
                placeholder="Enter organization description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-website">Website</Label>
              <Input
                id="org-website"
                type="url"
                value={orgForm.website}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, website: e.target.value })
                }
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOrgDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrganization}
              disabled={createOrgMutation.isPending}
            >
              {createOrgMutation.isPending
                ? "Creating..."
                : "Create Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog
        open={isEditMemberDialogOpen}
        onOpenChange={setIsEditMemberDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update member role and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={memberEditForm.role}
                onValueChange={(value: any) =>
                  setMemberEditForm({ ...memberEditForm, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="team_lead">Team Lead</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                {Object.entries(memberEditForm.permissions).map(
                  ([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-${key}`}
                        checked={value}
                        onChange={(e) =>
                          setMemberEditForm({
                            ...memberEditForm,
                            permissions: {
                              ...memberEditForm.permissions,
                              [key]: e.target.checked,
                            },
                          })
                        }
                      />
                      <Label htmlFor={`edit-${key}`} className="text-sm">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </Label>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditMemberDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMember}
              disabled={updateMemberMutation.isPending}
            >
              {updateMemberMutation.isPending ? "Updating..." : "Update Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
