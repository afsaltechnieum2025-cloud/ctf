import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Search,
  Mail,
  Calendar,
  MoreVertical,
  UserPlus,
  Loader2,
  Trash2,
  FolderKanban,
  Users as UsersIcon,
  Crown,
  Briefcase,
  ShieldCheck,
  UserCog,
  UserCheck,
  UserX,
  AtSign,
  Star,
  Building2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { triggerNotifyRefresh } from '@/utils/notifyRefresh';
import { API } from '@/utils/api';
import { cn } from '@/lib/utils';

type AppRole = 'admin' | 'manager' | 'tester' | 'client';

interface UserWithRole {
  id: number;
  name: string;
  full_name: string | null;
  email: string;
  role: AppRole | null;
  created_at: string;
}

interface Project {
  id: number;
  name: string;
  client: string;
}

interface ProjectAssignment {
  id: number;
  project_id: number;
  user_id: number;
}

// ── Create-user validation (same pattern as Findings / Projects) ─────────────

const ROLE_VALUES: AppRole[] = ['admin', 'manager', 'tester', 'client'];

const RE_USERNAME = /^[a-zA-Z0-9._-]{3,64}$/;
const RE_FULL_NAME = /^[\p{L}\p{M}\s'.-]{2,100}$/u;
const RE_EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const RE_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d)[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F]{8,128}$/;

type CreateUserFormErrors = Partial<
  Record<'name' | 'full_name' | 'email' | 'password' | 'role', string>
>;

type CreateUserFields = {
  name: string;
  full_name: string;
  email: string;
  password: string;
  role: AppRole;
};

function validateCreateUserForm(user: CreateUserFields): CreateUserFormErrors {
  const errors: CreateUserFormErrors = {};

  const name = user.name.trim();
  if (!name) errors.name = 'Username is required.';
  else if (!RE_USERNAME.test(name)) {
    errors.name = 'Use 3–64 characters: letters, numbers, period, underscore, or hyphen only.';
  }

  const fullName = user.full_name.trim();
  if (!fullName) errors.full_name = 'Full name is required.';
  else if (!RE_FULL_NAME.test(fullName)) {
    errors.full_name = 'Use 2–100 characters: letters, spaces, apostrophe, period, or hyphen.';
  }

  const email = user.email.trim();
  if (!email) errors.email = 'Email is required.';
  else if (!RE_EMAIL.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!user.password) errors.password = 'Password is required.';
  else if (!RE_PASSWORD.test(user.password)) {
    errors.password =
      'Use 8–128 characters with at least one letter and one number; no ASCII control characters.';
  }

  if (!ROLE_VALUES.includes(user.role)) {
    errors.role = 'Select a valid role.';
  }

  return errors;
}

const capitalizeRole = (role: AppRole | null): string => {
  if (!role) return 'No role';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

export default function Users() {
  const { role, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Role dialog
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('tester');
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Create user dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<CreateUserFormErrors>({});
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', full_name: '', role: 'tester' as AppRole,
  });

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);

  // Projects dialog
  const [isProjectsDialogOpen, setIsProjectsDialogOpen] = useState(false);
  const [selectedUserForProjects, setSelectedUserForProjects] = useState<UserWithRole | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [userAssignments, setUserAssignments] = useState<ProjectAssignment[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  // Profile dialog
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<UserWithRole | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  if (role !== 'admin' && role !== 'manager') return <Navigate to="/dashboard" replace />;

  // ── Shared auth headers helper ────────────────────────────────────────────
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/users`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Reset create-dialog state on close ───────────────────────────────────
  const resetCreateDialog = () => {
    setNewUser({ name: '', email: '', password: '', full_name: '', role: 'tester' });
    setFormErrors({});
    setShowPassword(false);
  };

  const clearFieldError = (key: keyof CreateUserFormErrors) => {
    setFormErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) resetCreateDialog();
  };

  // ── Create user ──────────────────────────────────────────────────────────
  const handleCreateUser = async () => {
    const errors = validateCreateUserForm(newUser);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`${API}/users`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: newUser.name.trim(),
          full_name: newUser.full_name.trim(),
          email: newUser.email.trim(),
          password: newUser.password,
          role: newUser.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('User created successfully!');
      setIsCreateDialogOpen(false);
      resetCreateDialog();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  // ── Role dialog ──────────────────────────────────────────────────────────
  const handleChangeRole = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole(user.role || 'tester');
    setIsRoleDialogOpen(true);
  };

  const saveRole = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API}/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      toast.success('Role updated successfully');
      setIsRoleDialogOpen(false);
      fetchUsers();
      triggerNotifyRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API}/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');
      toast.success('User deleted successfully!');
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
      triggerNotifyRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (user: UserWithRole) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  // ── Projects ─────────────────────────────────────────────────────────────
  const openProjectsDialog = async (user: UserWithRole) => {
    setSelectedUserForProjects(user);
    setIsProjectsDialogOpen(true);
    setIsLoadingProjects(true);
    try {
      const [projectsRes, assignmentsRes] = await Promise.all([
        fetch(`${API}/projects`, { headers: authHeaders() }),
        fetch(`${API}/users/${user.id}/projects`, { headers: authHeaders() }),
      ]);
      setAllProjects(await projectsRes.json());
      setUserAssignments(await assignmentsRes.json());
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const toggleProjectAssignment = async (projectId: number, isAssigned: boolean) => {
    if (!selectedUserForProjects) return;
    setIsSavingAssignments(true);
    try {
      if (isAssigned) {
        await fetch(`${API}/users/${selectedUserForProjects.id}/projects/${projectId}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        setUserAssignments(prev => prev.filter(a => a.project_id !== projectId));
        toast.success('Project unassigned');
        triggerNotifyRefresh();
      } else {
        const res = await fetch(`${API}/users/${selectedUserForProjects.id}/projects`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ project_id: projectId }),
        });
        const data = await res.json();
        setUserAssignments(prev => [...prev, { id: data.id, user_id: selectedUserForProjects.id, project_id: projectId }]);
        toast.success('Project assigned');
        triggerNotifyRefresh();
      }
    } catch {
      toast.error('Failed to update assignment');
    } finally {
      setIsSavingAssignments(false);
    }
  };

  const isProjectAssigned = (projectId: number) =>
    userAssignments.some(a => a.project_id === projectId);

  // ── Profile ──────────────────────────────────────────────────────────────
  const openUserProfile = (user: UserWithRole, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUserForProfile(user);
    setIsProfileDialogOpen(true);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── UI helpers ────────────────────────────────────────────────────────────
  const getRoleBadge = (userRole: AppRole | null) => {
    if (!userRole) return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border border-border text-muted-foreground">
        No role
      </span>
    );
    const styles: Record<AppRole, string> = {
      admin: 'bg-primary/15 text-primary border-primary/40',
      manager: 'bg-primary/15 text-primary border-primary/40',
      tester: 'bg-secondary text-muted-foreground border-border',
      client: 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[userRole]}`}>
        {capitalizeRole(userRole)}
      </span>
    );
  };

  const getRoleIcon = (userRole: AppRole | null) => {
    switch (userRole) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'manager': return <Briefcase className="h-4 w-4" />;
      case 'tester': return <ShieldCheck className="h-4 w-4" />;
      case 'client': return <Building2 className="h-4 w-4" />;
      default: return <UserCog className="h-4 w-4" />;
    }
  };

  // ── Shared role select items ──────────────────────────────────────────────
  const RoleSelectItems = () => (
    <>
      <SelectItem value="admin">
        <div className="flex items-center gap-2"><Crown className="h-4 w-4 text-primary" />Admin</div>
      </SelectItem>
      <SelectItem value="manager">
        <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" />Manager</div>
      </SelectItem>
      <SelectItem value="tester">
        <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Tester</div>
      </SelectItem>
      <SelectItem value="client">
        <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Client</div>
      </SelectItem>
    </>
  );

  const roleStats = {
    admins: users.filter(u => u.role === 'admin').length,
    managers: users.filter(u => u.role === 'manager').length,
    testers: users.filter(u => u.role === 'tester').length,
    clients: users.filter(u => u.role === 'client').length,
  };

  if (isLoading) {
    return (
      <DashboardLayout title="User Management" description="Manage team members and their roles">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Management" description="Manage team members and their roles">
      <div className="space-y-6 px-4 sm:px-0">

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Admins', count: roleStats.admins, Icon: Crown },
            { label: 'Managers', count: roleStats.managers, Icon: Briefcase },
            { label: 'Testers', count: roleStats.testers, Icon: ShieldCheck },
            { label: 'Clients', count: roleStats.clients, Icon: Building2 },
          ].map(({ label, count, Icon }, i) => (
            <Card key={label} className="animate-fade-in hover:shadow-lg transition-all" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Icon className="h-3 w-3 text-primary" />
                      {label}
                    </p>
                    <p className="text-2xl font-bold mt-1">{count}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Search + Add User ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 w-full"
            />
          </div>

          {/* ── Create User Dialog ─────────────────────────────────────── */}
          <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogChange}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="w-full sm:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Create New User
                </DialogTitle>
                <DialogDescription>
                  Add a new team member to the platform
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">

                {/* Username */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 mb-2">
                    <AtSign className="h-3 w-3" />
                    Username <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Enter username"
                    value={newUser.name}
                    onChange={(e) => {
                      clearFieldError('name');
                      setNewUser({ ...newUser, name: e.target.value });
                    }}
                    autoComplete="off"
                    className={cn(formErrors.name && 'border-destructive focus-visible:ring-destructive')}
                  />
                  {formErrors.name ? (
                    <p className="text-xs text-destructive mt-1">{formErrors.name}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">3–64 characters: letters, numbers, . _ -</p>
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 mb-2">
                    <UserCheck className="h-3 w-3" />
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Enter full name"
                    value={newUser.full_name}
                    onChange={(e) => {
                      clearFieldError('full_name');
                      setNewUser({ ...newUser, full_name: e.target.value });
                    }}
                    className={cn(formErrors.full_name && 'border-destructive focus-visible:ring-destructive')}
                  />
                  {formErrors.full_name ? (
                    <p className="text-xs text-destructive mt-1">{formErrors.full_name}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">2–100 characters; letters and common name punctuation</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 mb-2">
                    <Mail className="h-3 w-3" />
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    autoComplete="new-password"
                    value={newUser.email}
                    onChange={(e) => {
                      clearFieldError('email');
                      setNewUser({ ...newUser, email: e.target.value });
                    }}
                    className={cn(formErrors.email && 'border-destructive focus-visible:ring-destructive')}
                  />
                  {formErrors.email ? (
                    <p className="text-xs text-destructive mt-1">{formErrors.email}</p>
                  ) : null}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 mb-2">
                    <Star className="h-3 w-3" />
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters, include letters and numbers"
                      value={newUser.password}
                      autoComplete="new-password"
                      onChange={(e) => {
                        clearFieldError('password');
                        setNewUser({ ...newUser, password: e.target.value });
                      }}
                      className={cn(
                        'pr-10',
                        formErrors.password && 'border-destructive focus-visible:ring-destructive',
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formErrors.password ? (
                    <p className="text-xs text-destructive mt-1">{formErrors.password}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      8–128 characters; at least one letter and one number; no control characters.
                    </p>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 mb-2">
                    <UserCog className="h-3 w-3" />
                    Role <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(v) => {
                      clearFieldError('role');
                      setNewUser({ ...newUser, role: v as AppRole });
                    }}
                  >
                    <SelectTrigger className={cn(formErrors.role && 'border-destructive')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <RoleSelectItems />
                    </SelectContent>
                  </Select>
                  {formErrors.role ? <p className="text-xs text-destructive mt-1">{formErrors.role}</p> : null}
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => handleCreateDialogChange(false)}>
                    Cancel
                  </Button>
                  <Button variant="gradient" onClick={handleCreateUser} disabled={isCreating}>
                    {isCreating
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                      : 'Create User'
                    }
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Users Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((member, index) => (
            <Card
              key={member.id}
              glow
              className="animate-fade-in cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg group"
              onClick={(e) => member.role !== 'client' && openUserProfile(member, { stopPropagation: () => {} } as React.MouseEvent)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-lg shadow-lg shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate flex items-center gap-1">
                        {member.name}
                        {member.role === 'admin' && <Crown className="h-3 w-3 text-primary inline-block" />}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate text-xs">{member.email}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => handleChangeRole(member)}>
                        <UserCog className="h-4 w-4 mr-2" />Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openProjectsDialog(member)}>
                        <FolderKanban className="h-4 w-4 mr-2" />Manage Projects
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(member)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    {getRoleBadge(member.role)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="p-8 sm:p-12 text-center">
            <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
            <p className="text-lg font-medium">No users found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {users.length === 0 ? 'Add a user to get started' : 'Try adjusting your search'}
            </p>
          </Card>
        )}

        {/* ── Change Role Dialog ─────────────────────────────────────────── */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" />
                Change Role for {selectedUser?.name}
              </DialogTitle>
              <DialogDescription>Update the user's role and permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select New Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><RoleSelectItems /></SelectContent>
                </Select>
              </div>
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3">
                <Button type="button" variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
                <Button variant="gradient" onClick={saveRole} disabled={isSaving}>
                  {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Role'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Delete User Dialog ─────────────────────────────────────────── */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-destructive" />
                Delete User
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong className="text-foreground">{userToDelete?.name}</strong>?
                This action cannot be undone and will remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
                {isDeleting
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>
                  : <><Trash2 className="h-4 w-4 mr-2" />Delete User</>
                }
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Manage Projects Dialog ─────────────────────────────────────── */}
        <Dialog open={isProjectsDialogOpen} onOpenChange={setIsProjectsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                Manage Projects for {selectedUserForProjects?.name}
              </DialogTitle>
              <DialogDescription>Assign or unassign projects for this user</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {isLoadingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : allProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderKanban className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No projects available</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {allProjects.map((project) => {
                    const assigned = isProjectAssigned(project.id);
                    return (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Checkbox
                            id={String(project.id)}
                            checked={assigned}
                            onCheckedChange={() => toggleProjectAssignment(project.id, assigned)}
                            disabled={isSavingAssignments}
                          />
                          <div className="min-w-0">
                            <label htmlFor={String(project.id)} className="font-medium cursor-pointer truncate block">
                              {project.name}
                            </label>
                            <p className="text-xs text-muted-foreground truncate">{project.client}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsProjectsDialogOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── User Profile Dialog ───────────────────────────────────────── */}
        <UserProfileDialog
          userId={selectedUserForProfile?.id || 0}
          userName={selectedUserForProfile?.name || ''}
          userFullName={selectedUserForProfile?.full_name || undefined}
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
        />

      </div>
    </DashboardLayout>
  );
}