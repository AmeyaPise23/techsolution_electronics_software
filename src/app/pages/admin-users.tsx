import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Users, Shield, ShieldCheck, UserX, UserCheck } from "lucide-react";
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
import { userService, UserInfo, CreateUserData } from "../services/userService";
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
    role: "ROLE_USER",
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.listUsers(0, 100);
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
    setFormData({ username: "", email: "", password: "", role: "ROLE_USER" });
    setDialogOpen(true);
  }

  function handleEdit(user: UserInfo) {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    try {
      setSaving(true);
      if (editingUser) {
        const updateData: Record<string, unknown> = {};
        if (formData.email !== editingUser.email) updateData.email = formData.email;
        if (formData.password) updateData.password = formData.password;
        if (formData.role !== editingUser.role) updateData.role = formData.role;
        const updated = await userService.updateUser(editingUser.id, updateData);
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

  function roleLabel(role: string) {
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
                    <Badge variant={user.role === "ROLE_ADMIN" ? "default" : "secondary"} className="gap-1">
                      {user.role === "ROLE_ADMIN" ? <ShieldCheck className="size-3" /> : <Shield className="size-3" />}
                      {roleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.enabled ? "default" : "destructive"} className="text-xs">
                      {user.enabled ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(user.lastLogin)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
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
              <Label htmlFor="password">
                {editingUser ? "New Password (leave blank to keep)" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
                placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData((f) => ({ ...f, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROLE_USER">User</SelectItem>
                  <SelectItem value="ROLE_ADMIN">Admin</SelectItem>
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
