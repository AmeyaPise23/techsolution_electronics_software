import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Users, Shield, ShieldCheck, UserX, UserCheck, Crown, LockOpen } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  userService,
  UserInfo,
  CreateUserData,
  UpdateUserData,
  SystemRole,
  WorkRole,
  isRoot,
} from "../services/userService";
import { toast } from "sonner";

export function AdminUsers() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "ROLE_USER" as SystemRole,
    fullName: "",
    phone: "",
    workRole: "EMPLOYEE" as WorkRole,
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.listUsers({ page: 0, size: 100 });
      setUsers(data.content);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  function handleAdd() {
    setEditingUser(null);
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "ROLE_USER",
      fullName: "",
      phone: "",
      workRole: "EMPLOYEE",
    });
    setDialogOpen(true);
  }

  function handleEdit(user: UserInfo) {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      fullName: user.fullName ?? "",
      phone: user.phone ?? "",
      workRole: user.workRole,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    try {
      setSaving(true);
      if (editingUser) {
        const updateData: UpdateUserData = {};
        if (formData.email !== editingUser.email) updateData.email = formData.email;
        if (formData.role !== editingUser.role) updateData.role = formData.role;
        if (formData.workRole !== editingUser.workRole) updateData.workRole = formData.workRole;
        if (formData.fullName !== (editingUser.fullName ?? "")) updateData.fullName = formData.fullName;
        if (formData.phone !== (editingUser.phone ?? "")) updateData.phone = formData.phone;

        const updated = await userService.updateUser(editingUser.id, updateData);

        // A password is not part of the update payload — setting someone
        // else's password ends their sessions and forces a change at next
        // sign-in, so it is its own call rather than a silent side effect.
        if (formData.password) {
          await userService.resetPassword(editingUser.id, formData.password);
          toast.success("Password reset — the user's sessions have been ended");
        }

        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        toast.success("User updated");
      } else {
        if (!formData.username || !formData.email || !formData.password) {
          toast.error("Please fill all required fields");
          return;
        }
        const created = await userService.createUser(formData as CreateUserData);
        setUsers((prev) => [created, ...prev]);
        toast.success("User created");
      }
      setDialogOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save user");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleEnabled(user: UserInfo) {
    try {
      const updated = await userService.updateUser(user.id, { enabled: !user.enabled });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(updated.enabled ? "User enabled" : "User disabled");
    } catch {
      toast.error("Failed to update user status");
    }
  }

  async function handleUnlock(user: UserInfo) {
    try {
      const updated = await userService.unlockUser(user.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success("Account unlocked");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to unlock account");
    }
  }

  function roleLabel(role: string) {
    if (role === "ROLE_ROOT") return "Owner";
    if (role === "ROLE_ADMIN") return "Admin";
    if (role === "ROLE_USER") return "User";
    return role.replace("ROLE_", "");
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">
            Manage users in your company
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="size-4" />
          Add User
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Users className="size-3.5" />
          {users.length} users
        </Badge>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ROLE_USER" ? "secondary" : "default"} className="gap-1">
                      {isRoot(user) ? (
                        <Crown className="size-3" />
                      ) : user.role === "ROLE_ADMIN" ? (
                        <ShieldCheck className="size-3" />
                      ) : (
                        <Shield className="size-3" />
                      )}
                      {roleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={!user.enabled ? "destructive" : user.locked ? "outline" : "default"}
                      className="text-xs"
                    >
                      {!user.enabled ? "Disabled" : user.locked ? "Locked" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(user.lastLogin)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isRoot(user) ? (
                        // The owner account is shown for completeness but is
                        // read-only here; it maintains itself from the account
                        // screen. The server refuses these calls regardless —
                        // this only avoids offering a button that cannot work.
                        <span className="text-xs text-muted-foreground pr-2">
                          Owner account
                        </span>
                      ) : (
                        <>
                          {user.locked && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => handleUnlock(user)}
                              title="Unlock account"
                            >
                              <LockOpen className="size-4 text-amber-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleToggleEnabled(user)}
                            title={user.enabled ? "Disable user" : "Enable user"}
                          >
                            {user.enabled ? <UserX className="size-4 text-destructive" /> : <UserCheck className="size-4 text-green-600" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Create User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData((f) => ({ ...f, username: e.target.value }))}
                  placeholder="Enter username"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {editingUser ? "Reset password (leave blank to keep)" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
                placeholder={editingUser ? "Leave blank to keep current" : "At least 10 characters"}
              />
              <p className="text-xs text-muted-foreground">
                {editingUser
                  ? "Setting a password here ends the user's sessions and asks them to choose a new one at next sign-in."
                  : "At least 10 characters, with a letter and a digit."}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData((f) => ({ ...f, role: v as SystemRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Owner is absent by design: there is exactly one per
                      company, created when the company is provisioned, and the
                      server refuses to assign it. */}
                  <SelectItem value="ROLE_USER">User</SelectItem>
                  <SelectItem value="ROLE_ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only the owner account can grant or revoke Admin.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workRole">Work role</Label>
              <Select
                value={formData.workRole}
                onValueChange={(v) => setFormData((f) => ({ ...f, workRole: v as WorkRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingUser ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
