import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Calendar,
  Users as UsersIcon,
  Globe,
  ChevronRight,
  Filter,
  Loader2,
  UserPlus,
  Trash2,
  X,
  Check,
  UserMinus,
  AlertTriangle,
  Edit,
  Hash,
  Crosshair,
  KeyRound,
  GitBranch,
  Network,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { API as API_BASE } from '@/utils/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Project = {
  id: string;
  name: string;
  project_code?: string;
  client: string;
  description: string | null;
  scope: string | null;
  test_credentials: string | null;
  business_logic?: string | null;
  entry_points?: string | null;
  auth_controls?: string | null;
  tech_stack?: string | null;
  domain: string | null;
  ip_addresses: string[] | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  created_by: string | null;
  assignedTesters?: (string | number)[];
  findings_count?: number;
  critical_count?: number;
  high_count?: number;
  medium_count?: number;
  low_count?: number;
  info_count?: number;
  assignees_count?: number;
};

type Profile = {
  id: string;
  user_id: string;
  username: string;
  email?: string;
  role?: string;
};

type Assignee = {
  id: string;
  user_id: string;
  username: string;
  assigned_at: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token') ?? '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ─── Project form validation (create + edit dialogs) ─────────────────────────

const RE_NO_CONTROL = /^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F]{2,200}$/;
const RE_MULTILINE_TEXT = /^[^\x00]{10,8000}$/;
const RE_DOMAIN =
  /^(?:localhost|(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}))$/i;
const RE_FUNCTIONALITIES = /^[\p{L}\p{N}_\s.,;:/+\-–—()*\n#]{1,2000}$/u;
const RE_ASSIGNED_FOR = /^[\p{L}\p{N}_\s.,&\-–—/()'"]{1,1000}$/u;
const RE_AUTH_METHOD = /^[\p{L}\p{N}_\s.,;:/+\-–—()&]{1,1000}$/u;
const RE_TECH_STACK = /^[\p{L}\p{N}_\s.,+#\-/()+]{1,600}$/u;
const RE_TEST_CREDENTIALS = /^[\s\S]{1,8000}$/;

const IPV4_OCTET = String.raw`(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)`;
const RE_SINGLE_IPV4 = new RegExp(
  String.raw`^${IPV4_OCTET}\.${IPV4_OCTET}\.${IPV4_OCTET}\.${IPV4_OCTET}(?:\/(?:[0-9]|[12]\d|3[0-2]))?$`
);

function isValidOptionalIpList(value: string): boolean {
  const parts = value.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return false;
  return parts.every((p) => RE_SINGLE_IPV4.test(p));
}

type ProjectFormErrors = Partial<
  Record<
    | 'name'
    | 'client'
    | 'description'
    | 'scope'
    | 'domain'
    | 'startDate'
    | 'endDate'
    | 'business_logic'
    | 'entry_points'
    | 'auth_controls'
    | 'test_credentials'
    | 'ip_addresses'
    | 'tech_stack',
    string
  >
>;

type NewProjectFieldsForValidation = {
  name: string;
  client: string;
  description: string;
  scope: string;
  domain: string;
  business_logic: string;
  entry_points: string;
  auth_controls: string;
  test_credentials: string;
  ip_addresses: string;
  tech_stack: string;
};

function validateProjectForm(
  fields: NewProjectFieldsForValidation,
  startDate: Date | undefined,
  endDate: Date | undefined
): ProjectFormErrors {
  const errors: ProjectFormErrors = {};
  const name = fields.name.trim();
  const client = fields.client.trim();
  const description = fields.description.trim();
  const scope = fields.scope.trim();
  const domain = fields.domain.trim();

  if (!name) errors.name = 'Project name is required.';
  else if (!RE_NO_CONTROL.test(name)) errors.name = 'Use 2–200 characters; control characters are not allowed.';

  if (!client) errors.client = 'Client name is required.';
  else if (!RE_NO_CONTROL.test(client)) errors.client = 'Use 2–200 characters; control characters are not allowed.';

  if (!description) errors.description = 'Description is required.';
  else if (!RE_MULTILINE_TEXT.test(description)) errors.description = 'Use 10–8000 characters (no null bytes).';

  if (!scope) errors.scope = 'Engagement scope is required.';
  else if (!RE_MULTILINE_TEXT.test(scope)) errors.scope = 'Use 10–8000 characters (no null bytes).';

  if (!domain) errors.domain = 'Target domain is required.';
  else if (!RE_DOMAIN.test(domain)) errors.domain = 'Enter a valid hostname (e.g., example.com or sub.example.co.uk).';

  if (!startDate) errors.startDate = 'Start date is required.';
  if (!endDate) errors.endDate = 'End date is required.';
  if (startDate && endDate) {
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(0, 0, 0, 0);
    if (e < s) errors.endDate = 'End date must be on or after the start date.';
  }

  const bl = fields.business_logic.trim();
  if (bl && !RE_FUNCTIONALITIES.test(bl)) {
    errors.business_logic =
      'Allowed: letters, numbers, common punctuation, and newlines (max 2000 characters).';
  }

  const ef = fields.entry_points.trim();
  if (ef && !RE_ASSIGNED_FOR.test(ef)) {
    errors.entry_points =
      'Allowed: letters, numbers, spaces, and common punctuation (max 1000 characters).';
  }

  const am = fields.auth_controls.trim();
  if (am && !RE_AUTH_METHOD.test(am)) {
    errors.auth_controls =
      'Allowed: letters, numbers, spaces, and common punctuation (max 1000 characters).';
  }

  const tc = fields.test_credentials;
  if (tc.trim()) {
    if (!RE_TEST_CREDENTIALS.test(tc) || tc.includes('\x00')) {
      errors.test_credentials = 'Use 1–8000 characters; null bytes are not allowed.';
    }
  }

  const ips = fields.ip_addresses.trim();
  if (ips && !isValidOptionalIpList(ips)) {
    errors.ip_addresses =
      'Use comma-separated IPv4 addresses, optional /0–32 CIDR (e.g., 192.168.1.1, 10.0.0.0/24).';
  }

  const ts = fields.tech_stack.trim();
  if (ts && !RE_TECH_STACK.test(ts)) {
    errors.tech_stack =
      'Allowed: letters, numbers, spaces, commas, and common symbols (max 600 characters).';
  }

  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Projects() {
  const { role, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Multi-select assign state
  const [currentAssignees, setCurrentAssignees] = useState<Assignee[]>([]);
  const [selectedTesters, setSelectedTesters] = useState<string[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    description: '',
    business_logic: '',
    entry_points: '',
    auth_controls: '',
    scope: '',
    test_credentials: '',
    domain: '',
    ip_addresses: '',
    tech_stack: '',
    start_date: '',
    end_date: '',
    status: 'active',
  });

  const [createFormErrors, setCreateFormErrors] = useState<ProjectFormErrors>({});
  const [editFormErrors, setEditFormErrors] = useState<ProjectFormErrors>({});

  const clearCreateFieldError = (key: keyof ProjectFormErrors) => {
    setCreateFormErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleCreateDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setCreateFormErrors({});
  };

  const clearEditFieldError = (key: keyof ProjectFormErrors) => {
    setEditFormErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) setEditFormErrors({});
  };

  const [editProject, setEditProject] = useState({
    id: '',
    name: '',
    client: '',
    description: '',
    business_logic: '',
    entry_points: '',
    auth_controls: '',
    scope: '',
    test_credentials: '',
    domain: '',
    ip_addresses: '',
    tech_stack: '',
    start_date: '',
    end_date: '',
    status: 'active',
  });

  // Date picker states
  const [createStartDate, setCreateStartDate] = useState<Date | undefined>(undefined);
  const [createEndDate, setCreateEndDate] = useState<Date | undefined>(undefined);
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchProjects();
    fetchProfiles();
  }, [user]);

  // ─── Role helpers ─────────────────────────────────────────────────────────

  const isAdminOrManager = role === 'admin' || role === 'manager';

  const isAssignedToProject = (project: Project): boolean => {
    if (!user?.id || !project.assignedTesters) return false;
    return project.assignedTesters.some((t) => String(t) === String(user.id));
  };

  // ─── Visible projects ─────────────────────────────────────────────────────

  const visibleProjects = useMemo(() => {
    if (isAdminOrManager) return allProjects;
    return allProjects.filter(isAssignedToProject);
  }, [allProjects, isAdminOrManager, user?.id]);

  // ─── Fetch projects ───────────────────────────────────────────────────────

  const fetchProjects = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/projects`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Projects API returned ${res.status}`);
      const data = await res.json();

      const projectsWithCounts = await Promise.all(
        data.map(async (project: Project) => {
          try {
            const findingsRes = await fetch(`${API_BASE}/findings?project_id=${project.id}`, { headers: authHeaders() });
            if (findingsRes.ok) {
              const findings = await findingsRes.json();
              const criticalCount = findings.filter((f: any) => String(f.severity).toLowerCase() === 'critical').length;
              const highCount     = findings.filter((f: any) => String(f.severity).toLowerCase() === 'high').length;
              const mediumCount   = findings.filter((f: any) => String(f.severity).toLowerCase() === 'medium').length;
              const lowCount      = findings.filter((f: any) => String(f.severity).toLowerCase() === 'low').length;
              const infoCount     = findings.filter((f: any) =>
                String(f.severity).toLowerCase() === 'informational' ||
                String(f.severity).toLowerCase() === 'info'
              ).length;

              const assigneesRes = await fetch(`${API_BASE}/projects/${project.id}/assignments`, { headers: authHeaders() });
              let assigneesCount = 0;
              if (assigneesRes.ok) {
                const assignees = await assigneesRes.json();
                assigneesCount = assignees.length;
              }

              return {
                ...project,
                findings_count: findings.length,
                critical_count: criticalCount,
                high_count: highCount,
                medium_count: mediumCount,
                low_count: lowCount,
                info_count: infoCount,
                assignees_count: assigneesCount,
              };
            }
          } catch (error) {
            console.error(`Error fetching findings for project ${project.id}:`, error);
          }
          return { ...project, findings_count: 0, assignees_count: 0 };
        })
      );

      setAllProjects(projectsWithCounts);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Fetch users ──────────────────────────────────────────────────────────

  const fetchProfiles = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/users`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const normalised: Profile[] = data.map((u: any) => ({
        id: u.id,
        user_id: u.id,
        username: u.username ?? u.name ?? u.email ?? String(u.id),
        email: u.email,
        role: u.role,
      }));
      setProfiles(normalised);
    } catch (error) {
      console.warn('fetchProfiles failed (non-critical):', error);
    }
  };

  // ─── Fetch assignees ──────────────────────────────────────────────────────

  const fetchAssignees = async (projectId: string) => {
    setLoadingAssignees(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/assignments`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch assignees');
      const data: Assignee[] = await res.json();
      setCurrentAssignees(data);
    } catch {
      toast.error('Failed to load current team members');
      setCurrentAssignees([]);
    } finally {
      setLoadingAssignees(false);
    }
  };

  // ─── Filter ───────────────────────────────────────────────────────────────

  const filteredProjects = visibleProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.project_code && project.project_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.domain && project.domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.scope && project.scope.toLowerCase().includes(searchQuery.toLowerCase())); // ← NEW: scope is searchable
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  /** Same ordering as before: sort by numeric part of project code; missing code last */
  const sortedFilteredProjects = useMemo(() => {
    const sortKey = (p: Project): [number, string, string] => {
      const c = p.project_code?.trim();
      if (!c) return [Number.MAX_SAFE_INTEGER, '', p.name];
      const nums = c.match(/\d+/g);
      const n = nums?.length ? parseInt(nums[nums.length - 1], 10) : NaN;
      if (!Number.isNaN(n)) return [n, c, p.name];
      return [Number.MAX_SAFE_INTEGER - 1, c, p.name];
    };
    return [...filteredProjects].sort((a, b) => {
      const [na, ca, na2] = sortKey(a);
      const [nb, cb, nb2] = sortKey(b);
      if (na !== nb) return na - nb;
      const cmp = ca.localeCompare(cb);
      if (cmp !== 0) return cmp;
      return na2.localeCompare(nb2);
    });
  }, [filteredProjects]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getStatusBadge = (status: string | null) => {
    const key = (status || 'pending').toLowerCase();
    if (key === 'completed') {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">Completed</Badge>;
    }
    const variants: Record<string, 'active' | 'pending' | 'overdue' | 'secondary'> = {
      active: 'active',
      pending: 'pending',
      overdue: 'overdue',
    };
    const variant = variants[key] || 'secondary';
    const labels: Record<string, string> = {
      active: 'Active',
      pending: 'Pending',
      overdue: 'Overdue',
    };
    const label = labels[key] ?? (status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Pending');
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const toggleTesterSelection = (profileId: string) => {
    setSelectedTesters(prev =>
      prev.includes(profileId) ? prev.filter(id => id !== profileId) : [...prev, profileId]
    );
  };

  // ─── Create project ───────────────────────────────────────────────────────

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateProjectForm(
      {
        name: newProject.name,
        client: newProject.client,
        description: newProject.description,
        scope: newProject.scope,
        domain: newProject.domain,
        business_logic: newProject.business_logic,
        entry_points: newProject.entry_points,
        auth_controls: newProject.auth_controls,
        test_credentials: newProject.test_credentials,
        ip_addresses: newProject.ip_addresses,
        tech_stack: newProject.tech_stack,
      },
      createStartDate,
      createEndDate
    );
    setCreateFormErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    try {
      let ipAddresses = null;
      if (newProject.ip_addresses && newProject.ip_addresses.trim()) {
        ipAddresses = newProject.ip_addresses
          .split(',')
          .map(ip => ip.trim())
          .filter(ip => ip.length > 0);
      }

      const projectData = {
        name: newProject.name.trim(),
        client: newProject.client.trim(),
        description: newProject.description.trim() || null,
        business_logic: newProject.business_logic.trim() || null,
        entry_points: newProject.entry_points.trim() || null,
        auth_controls: newProject.auth_controls.trim() || null,
        scope: newProject.scope.trim() || null,
        test_credentials: newProject.test_credentials.trim() || null,
        domain: newProject.domain.trim() || null,
        ip_addresses: ipAddresses,
        tech_stack: newProject.tech_stack.trim() || null,
        start_date: createStartDate ? createStartDate.toISOString().split('T')[0] : null,
        end_date: createEndDate ? createEndDate.toISOString().split('T')[0] : null,
        status: newProject.status,
        created_by: user?.id,
      };

      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(projectData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create project');
      }

      toast.success('Project created successfully!');
      setIsDialogOpen(false);
      setCreateFormErrors({});
      setNewProject({
        name: '', client: '', description: '',
        business_logic: '', entry_points: '', auth_controls: '',
        scope: '',
        test_credentials: '',
        domain: '', ip_addresses: '', tech_stack: '',
        start_date: '', end_date: '', status: 'active',
      });
      setCreateStartDate(undefined);
      setCreateEndDate(undefined);
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    }
  };

  // ─── Edit project ─────────────────────────────────────────────────────────

  const openEditDialog = (project: Project) => {
    setEditProject({
      id: project.id,
      name: project.name,
      client: project.client,
      description: project.description || '',
      business_logic: project.business_logic || '',
      entry_points: project.entry_points || '',
      auth_controls: project.auth_controls || '',
      scope: project.scope || '',
      test_credentials: project.test_credentials || '',
      domain: project.domain || '',
      ip_addresses: project.ip_addresses ? project.ip_addresses.join(', ') : '',
      tech_stack: project.tech_stack || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      status: project.status || 'active',
    });
    setEditStartDate(project.start_date ? new Date(project.start_date) : undefined);
    setEditEndDate(project.end_date ? new Date(project.end_date) : undefined);
    setEditFormErrors({});
    setIsEditDialogOpen(true);
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateProjectForm(
      {
        name: editProject.name,
        client: editProject.client,
        description: editProject.description,
        scope: editProject.scope,
        domain: editProject.domain,
        business_logic: editProject.business_logic,
        entry_points: editProject.entry_points,
        auth_controls: editProject.auth_controls,
        test_credentials: editProject.test_credentials,
        ip_addresses: editProject.ip_addresses,
        tech_stack: editProject.tech_stack,
      },
      editStartDate,
      editEndDate
    );
    setEditFormErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setIsEditing(true);
    try {
      let ipAddresses = null;
      if (editProject.ip_addresses && editProject.ip_addresses.trim()) {
        ipAddresses = editProject.ip_addresses
          .split(',')
          .map(ip => ip.trim())
          .filter(ip => ip.length > 0);
      }

      const projectData = {
        name: editProject.name.trim(),
        client: editProject.client.trim(),
        description: editProject.description.trim() || null,
        business_logic: editProject.business_logic.trim() || null,
        entry_points: editProject.entry_points.trim() || null,
        auth_controls: editProject.auth_controls.trim() || null,
        scope: editProject.scope.trim() || null,
        test_credentials: editProject.test_credentials.trim() || null,
        domain: editProject.domain.trim() || null,
        ip_addresses: ipAddresses,
        tech_stack: editProject.tech_stack.trim() || null,
        start_date: editStartDate ? editStartDate.toISOString().split('T')[0] : null,
        end_date: editEndDate ? editEndDate.toISOString().split('T')[0] : null,
        status: editProject.status,
      };

      const res = await fetch(`${API_BASE}/projects/${editProject.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(projectData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update project');
      }

      toast.success('Project updated successfully!');
      handleEditDialogOpenChange(false);
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update project');
    } finally {
      setIsEditing(false);
    }
  };

  // ─── Assign testers ───────────────────────────────────────────────────────

  const handleAssignTesters = async () => {
    if (!selectedProject || selectedTesters.length === 0) {
      toast.error('Please select at least one tester');
      return;
    }

    setIsAssigning(true);
    let successCount = 0;
    let skipCount = 0;

    try {
      for (const profileId of selectedTesters) {
        const profile = profiles.find(p => p.id === profileId);
        if (!profile) continue;

        const res = await fetch(`${API_BASE}/projects/${selectedProject.id}/assignments`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ user_id: profile.user_id, assigned_by_id: user?.id }),
        });

        if (res.status === 409) { skipCount++; continue; }
        if (res.ok) { successCount++; }
      }

      if (successCount > 0) toast.success(`${successCount} tester${successCount > 1 ? 's' : ''} assigned successfully!`);
      if (skipCount > 0) toast.info(`${skipCount} tester${skipCount > 1 ? 's were' : ' was'} already assigned`);

      setSelectedTesters([]);
      await fetchAssignees(selectedProject.id);
      fetchProjects();
    } catch {
      toast.error('Failed to assign testers');
    } finally {
      setIsAssigning(false);
    }
  };

  // ─── Remove assignee ──────────────────────────────────────────────────────

  const handleRemoveAssignee = async (assignee: Assignee) => {
    if (!selectedProject) return;
    setRemovingUserId(assignee.user_id);
    try {
      const res = await fetch(
        `${API_BASE}/projects/${selectedProject.id}/assignments/${assignee.user_id}`,
        { method: 'DELETE', headers: authHeaders() }
      );
      if (!res.ok) throw new Error('Failed to remove');
      setCurrentAssignees(prev => prev.filter(a => a.user_id !== assignee.user_id));
      toast.success(`${assignee.username} removed from project`);
      fetchProjects();
    } catch {
      toast.error('Failed to remove team member');
    } finally {
      setRemovingUserId(null);
    }
  };

  const openAssignDialog = async (project: Project) => {
    setSelectedProject(project);
    setSelectedTesters([]);
    setUserSearchQuery('');
    setIsAssignDialogOpen(true);
    await fetchAssignees(project.id);
  };

  // ─── Delete project ───────────────────────────────────────────────────────

  const openDeleteDialog = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectToDelete.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete project');
      toast.success('Project deleted successfully!');
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
      fetchProjects();
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Derived ──────────────────────────────────────────────────────────────

  const assignedUserIds = new Set(currentAssignees.map(a => String(a.user_id)));
  const availableProfiles = profiles.filter(
    p => !assignedUserIds.has(String(p.user_id)) &&
      (userSearchQuery === '' || p.username.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <DashboardLayout title="Projects" description="Manage and track all penetration testing engagements">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Projects" description="Manage and track all penetration testing engagements">
      <div className="space-y-6">

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, client, project code, domain, scope..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-secondary/50">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          {isAdminOrManager && (
            <Dialog open={isDialogOpen} onOpenChange={handleCreateDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="gradient-technieum"><Plus className="h-4 w-4 mr-2" />New Project</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">Create New Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Project Name *</Label>
                      <Input
                        placeholder="e.g., Security Assessment Q1 2026"
                        value={newProject.name}
                        onChange={(e) => {
                          clearCreateFieldError('name');
                          setNewProject({ ...newProject, name: e.target.value });
                        }}
                        required
                        className={cn(createFormErrors.name && 'border-destructive')}
                      />
                      {createFormErrors.name ? (
                        <p className="text-xs text-destructive">{createFormErrors.name}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label>Client Name *</Label>
                      <Input
                        placeholder="e.g., Acme Corporation"
                        value={newProject.client}
                        onChange={(e) => {
                          clearCreateFieldError('client');
                          setNewProject({ ...newProject, client: e.target.value });
                        }}
                        required
                        className={cn(createFormErrors.client && 'border-destructive')}
                      />
                      {createFormErrors.client ? (
                        <p className="text-xs text-destructive">{createFormErrors.client}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea
                      placeholder="Describe the project scope, objectives, and any special requirements..."
                      value={newProject.description}
                      onChange={(e) => {
                        clearCreateFieldError('description');
                        setNewProject({ ...newProject, description: e.target.value });
                      }}
                      rows={3}
                      required
                      className={cn(createFormErrors.description && 'border-destructive')}
                    />
                    {createFormErrors.description ? (
                      <p className="text-xs text-destructive">{createFormErrors.description}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">10–8000 characters</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <GitBranch className="h-3.5 w-3.5 text-primary shrink-0" />
                        No. of functionalities <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                      </Label>
                      <Textarea
                        placeholder="e.g., count or list of functionalities, modules, or features in scope."
                        value={newProject.business_logic}
                        onChange={(e) => {
                          clearCreateFieldError('business_logic');
                          setNewProject({ ...newProject, business_logic: e.target.value });
                        }}
                        rows={3}
                        className={cn(createFormErrors.business_logic && 'border-destructive')}
                      />
                      {createFormErrors.business_logic ? (
                        <p className="text-xs text-destructive">{createFormErrors.business_logic}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Network className="h-3.5 w-3.5 text-primary shrink-0" />
                        Assigned For <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                      </Label>
                      <Textarea
                        placeholder="e.g., team, role, or stakeholder this engagement is assigned to."
                        value={newProject.entry_points}
                        onChange={(e) => {
                          clearCreateFieldError('entry_points');
                          setNewProject({ ...newProject, entry_points: e.target.value });
                        }}
                        rows={3}
                        className={cn(createFormErrors.entry_points && 'border-destructive')}
                      />
                      {createFormErrors.entry_points ? (
                        <p className="text-xs text-destructive">{createFormErrors.entry_points}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                      Authentication method <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                    </Label>
                    <Textarea
                      placeholder="e.g., SSO, OAuth, JWT, MFA, API keys, basic auth, session handling."
                      value={newProject.auth_controls}
                      onChange={(e) => {
                        clearCreateFieldError('auth_controls');
                        setNewProject({ ...newProject, auth_controls: e.target.value });
                      }}
                      rows={3}
                      className={cn(createFormErrors.auth_controls && 'border-destructive')}
                    />
                    {createFormErrors.auth_controls ? (
                      <p className="text-xs text-destructive">{createFormErrors.auth_controls}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Crosshair className="h-3.5 w-3.5 text-primary" />Engagement scope *
                    </Label>
                    <Textarea
                      placeholder="Define what is in scope and out of scope — e.g., included domains, IP ranges, excluded environments, test boundaries..."
                      value={newProject.scope}
                      onChange={(e) => {
                        clearCreateFieldError('scope');
                        setNewProject({ ...newProject, scope: e.target.value });
                      }}
                      rows={3}
                      required
                      className={cn(createFormErrors.scope && 'border-destructive')}
                    />
                    {createFormErrors.scope ? (
                      <p className="text-xs text-destructive">{createFormErrors.scope}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Clearly describe in-scope and out-of-scope assets (10–8000 characters)</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-primary" />
                      Testing credentials <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Textarea
                        placeholder="e.g., Username: testuser@example.com / Password: Test@1234&#10;Role: Admin — URL: https://app.example.com/login"
                        value={newProject.test_credentials}
                        onChange={(e) => {
                          clearCreateFieldError('test_credentials');
                          setNewProject({ ...newProject, test_credentials: e.target.value });
                        }}
                        rows={3}
                        className={cn(
                          'border-orange-500/40 bg-orange-500/5 focus:border-orange-500/70 placeholder:text-muted-foreground/50 font-mono text-sm',
                          createFormErrors.test_credentials && 'border-destructive'
                        )}
                      />
                    </div>
                    {createFormErrors.test_credentials ? (
                      <p className="text-xs text-destructive">{createFormErrors.test_credentials}</p>
                    ) : (
                      <p className="text-xs text-orange-400/80 flex items-center gap-1">
                        <KeyRound className="h-3 w-3" />If provided: 1–8000 characters, no null bytes
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Target Domain *</Label>
                      <Input
                        placeholder="e.g., example.com"
                        value={newProject.domain}
                        onChange={(e) => {
                          clearCreateFieldError('domain');
                          setNewProject({ ...newProject, domain: e.target.value });
                        }}
                        required
                        className={cn(createFormErrors.domain && 'border-destructive')}
                      />
                      {createFormErrors.domain ? (
                        <p className="text-xs text-destructive">{createFormErrors.domain}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Primary domain for the assessment</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Target IPs <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                      </Label>
                      <Input
                        placeholder="e.g., 192.168.1.1, 10.0.0.0/24"
                        value={newProject.ip_addresses}
                        onChange={(e) => {
                          clearCreateFieldError('ip_addresses');
                          setNewProject({ ...newProject, ip_addresses: e.target.value });
                        }}
                        className={cn(createFormErrors.ip_addresses && 'border-destructive')}
                      />
                      {createFormErrors.ip_addresses ? (
                        <p className="text-xs text-destructive">{createFormErrors.ip_addresses}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Comma-separated IPv4, optional CIDR mask /0–32</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                      Tech stack <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                    </Label>
                    <Input
                      placeholder="e.g., React, Node.js, PostgreSQL, AWS (comma-separated)"
                      value={newProject.tech_stack}
                      onChange={(e) => {
                        clearCreateFieldError('tech_stack');
                        setNewProject({ ...newProject, tech_stack: e.target.value });
                      }}
                      className={cn(createFormErrors.tech_stack && 'border-destructive')}
                    />
                    {createFormErrors.tech_stack ? (
                      <p className="text-xs text-destructive">{createFormErrors.tech_stack}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Shown on the project overview as tags</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal bg-background',
                              createFormErrors.startDate && 'border-destructive'
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {createStartDate ? format(createStartDate, 'PPP') : 'Select start date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={createStartDate}
                            onSelect={(d) => {
                              clearCreateFieldError('startDate');
                              setCreateStartDate(d);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {createFormErrors.startDate ? (
                        <p className="text-xs text-destructive">{createFormErrors.startDate}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal bg-background',
                              createFormErrors.endDate && 'border-destructive'
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {createEndDate ? format(createEndDate, 'PPP') : 'Select end date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={createEndDate}
                            onSelect={(d) => {
                              clearCreateFieldError('endDate');
                              setCreateEndDate(d);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {createFormErrors.endDate ? (
                        <p className="text-xs text-destructive">{createFormErrors.endDate}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Initial Status</Label>
                    <Select value={newProject.status} onValueChange={(v) => setNewProject({ ...newProject, status: v })}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" className="gradient-technieum">Create Project</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* ── Projects Grid ── */}
        {filteredProjects.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              {visibleProjects.length === 0 ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary/30 flex items-center justify-center">
                    <Globe className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-lg font-medium">
                    {isAdminOrManager ? 'No projects yet' : 'No assigned projects yet'}
                  </p>
                  <p className="text-sm mt-1">
                    {isAdminOrManager
                      ? 'Create your first project to get started with security assessments'
                      : 'You have not been assigned to any projects yet. Contact your manager to get assigned.'}
                  </p>
                  {isAdminOrManager && (
                    <Button className="gradient-technieum mt-4" onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />Create Project
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">No matching projects found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
                </>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedFilteredProjects.map((project) => {
              const previewText =
                project.description?.trim() || project.scope?.trim() || '';
              return (
                <Card
                  key={project.id}
                  className="border-orange-500/15 bg-card/80 transition-colors hover:border-orange-500/30"
                >
                  <CardContent className="p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {project.project_code ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                              <Hash className="h-3 w-3" />
                              {project.project_code}
                            </span>
                          ) : null}
                          <Link
                            to={`/projects/${project.id}`}
                            className="text-base font-semibold leading-tight text-foreground hover:text-primary transition-colors"
                          >
                            {project.name}
                          </Link>
                        </div>
                        <p className="text-sm text-muted-foreground">{project.client}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {getStatusBadge(project.status)}
                        {isAdminOrManager && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 border-border bg-secondary/50 text-xs"
                            onClick={() => openEditDialog(project)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                      <div className="min-w-0">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Domain
                        </p>
                        <p className="truncate text-sm font-semibold">
                          {project.domain || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          IP addresses
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {project.ip_addresses?.length ?? 0}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Timeline
                        </p>
                        <p className="text-sm font-semibold leading-snug">
                          {formatDate(project.start_date)} – {formatDate(project.end_date)}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Team
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {project.assignees_count ?? 0}{' '}
                          {(project.assignees_count ?? 0) === 1 ? 'tester' : 'testers'}
                        </p>
                      </div>
                    </div>

                    {previewText ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{previewText}</p>
                    ) : null}

                    {!!project.findings_count && project.findings_count > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Findings
                        </span>
                        {(project.critical_count ?? 0) > 0 && (
                          <Badge className="text-xs border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400">
                            {project.critical_count} Critical
                          </Badge>
                        )}
                        {(project.high_count ?? 0) > 0 && (
                          <Badge className="text-xs border-orange-500/25 bg-orange-500/10 text-orange-600 dark:text-orange-400">
                            {project.high_count} High
                          </Badge>
                        )}
                        {(project.medium_count ?? 0) > 0 && (
                          <Badge className="text-xs border-yellow-500/25 bg-yellow-500/10 text-yellow-700 dark:text-yellow-500">
                            {project.medium_count} Medium
                          </Badge>
                        )}
                        {(project.low_count ?? 0) > 0 && (
                          <Badge className="text-xs border-yellow-500/20 bg-yellow-500/5 text-muted-foreground">
                            {project.low_count} Low
                          </Badge>
                        )}
                        {(project.info_count ?? 0) > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {project.info_count} Info
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground tabular-nums">
                          ({project.findings_count} total)
                        </span>
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-3 border-t border-border/40 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground tabular-nums">
                          {project.findings_count ?? 0}
                        </span>{' '}
                        findings recorded
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {isAdminOrManager && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-border bg-secondary/50"
                            onClick={() => openAssignDialog(project)}
                          >
                            <UserPlus className="h-4 w-4 mr-1.5" />
                            Assign
                          </Button>
                        )}
                        {role === 'admin' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10"
                            onClick={() => openDeleteDialog(project)}
                          >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Delete
                          </Button>
                        )}
                        <Button type="button" size="sm" className="gradient-technieum" asChild>
                          <Link to={`/projects/${project.id}`}>
                            Open project
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Edit Project Dialog ── */}
        <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />Edit Project
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditProject} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Name *</Label>
                  <Input
                    placeholder="e.g., Security Assessment Q1 2026"
                    value={editProject.name}
                    onChange={(e) => {
                      clearEditFieldError('name');
                      setEditProject({ ...editProject, name: e.target.value });
                    }}
                    required
                    className={cn(editFormErrors.name && 'border-destructive')}
                  />
                  {editFormErrors.name ? (
                    <p className="text-xs text-destructive">{editFormErrors.name}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input
                    placeholder="e.g., Acme Corporation"
                    value={editProject.client}
                    onChange={(e) => {
                      clearEditFieldError('client');
                      setEditProject({ ...editProject, client: e.target.value });
                    }}
                    required
                    className={cn(editFormErrors.client && 'border-destructive')}
                  />
                  {editFormErrors.client ? (
                    <p className="text-xs text-destructive">{editFormErrors.client}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Describe the project scope, objectives, and any special requirements..."
                  value={editProject.description}
                  onChange={(e) => {
                    clearEditFieldError('description');
                    setEditProject({ ...editProject, description: e.target.value });
                  }}
                  rows={3}
                  required
                  className={cn(editFormErrors.description && 'border-destructive')}
                />
                {editFormErrors.description ? (
                  <p className="text-xs text-destructive">{editFormErrors.description}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">10–8000 characters</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-primary shrink-0" />
                    No. of functionalities <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Textarea
                    placeholder="e.g., count or list of functionalities, modules, or features in scope."
                    value={editProject.business_logic}
                    onChange={(e) => {
                      clearEditFieldError('business_logic');
                      setEditProject({ ...editProject, business_logic: e.target.value });
                    }}
                    rows={3}
                    className={cn(editFormErrors.business_logic && 'border-destructive')}
                  />
                  {editFormErrors.business_logic ? (
                    <p className="text-xs text-destructive">{editFormErrors.business_logic}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Network className="h-3.5 w-3.5 text-primary shrink-0" />
                    Assigned For <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Textarea
                    placeholder="e.g., team, role, or stakeholder this engagement is assigned to."
                    value={editProject.entry_points}
                    onChange={(e) => {
                      clearEditFieldError('entry_points');
                      setEditProject({ ...editProject, entry_points: e.target.value });
                    }}
                    rows={3}
                    className={cn(editFormErrors.entry_points && 'border-destructive')}
                  />
                  {editFormErrors.entry_points ? (
                    <p className="text-xs text-destructive">{editFormErrors.entry_points}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  Authentication method <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Textarea
                  placeholder="e.g., SSO, OAuth, JWT, MFA, API keys, basic auth, session handling."
                  value={editProject.auth_controls}
                  onChange={(e) => {
                    clearEditFieldError('auth_controls');
                    setEditProject({ ...editProject, auth_controls: e.target.value });
                  }}
                  rows={3}
                  className={cn(editFormErrors.auth_controls && 'border-destructive')}
                />
                {editFormErrors.auth_controls ? (
                  <p className="text-xs text-destructive">{editFormErrors.auth_controls}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Crosshair className="h-3.5 w-3.5 text-primary" />Engagement scope *
                </Label>
                <Textarea
                  placeholder="Define what is in scope and out of scope — e.g., included domains, IP ranges, excluded environments, test boundaries..."
                  value={editProject.scope}
                  onChange={(e) => {
                    clearEditFieldError('scope');
                    setEditProject({ ...editProject, scope: e.target.value });
                  }}
                  rows={3}
                  required
                  className={cn(editFormErrors.scope && 'border-destructive')}
                />
                {editFormErrors.scope ? (
                  <p className="text-xs text-destructive">{editFormErrors.scope}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Clearly describe in-scope and out-of-scope assets (10–8000 characters)</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                  Testing credentials <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <div className="relative">
                  <Textarea
                    placeholder="e.g., Username: testuser@example.com / Password: Test@1234&#10;Role: Admin — URL: https://app.example.com/login"
                    value={editProject.test_credentials}
                    onChange={(e) => {
                      clearEditFieldError('test_credentials');
                      setEditProject({ ...editProject, test_credentials: e.target.value });
                    }}
                    rows={3}
                    className={cn(
                      'border-orange-500/40 bg-orange-500/5 focus:border-orange-500/70 placeholder:text-muted-foreground/50 font-mono text-sm',
                      editFormErrors.test_credentials && 'border-destructive'
                    )}
                  />
                </div>
                {editFormErrors.test_credentials ? (
                  <p className="text-xs text-destructive">{editFormErrors.test_credentials}</p>
                ) : (
                  <p className="text-xs text-orange-400/80 flex items-center gap-1">
                    <KeyRound className="h-3 w-3" />If provided: 1–8000 characters, no null bytes
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Domain *</Label>
                  <Input
                    placeholder="e.g., example.com"
                    value={editProject.domain}
                    onChange={(e) => {
                      clearEditFieldError('domain');
                      setEditProject({ ...editProject, domain: e.target.value });
                    }}
                    required
                    className={cn(editFormErrors.domain && 'border-destructive')}
                  />
                  {editFormErrors.domain ? (
                    <p className="text-xs text-destructive">{editFormErrors.domain}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Primary domain for the assessment</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>
                    Target IPs <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g., 192.168.1.1, 10.0.0.0/24"
                    value={editProject.ip_addresses}
                    onChange={(e) => {
                      clearEditFieldError('ip_addresses');
                      setEditProject({ ...editProject, ip_addresses: e.target.value });
                    }}
                    className={cn(editFormErrors.ip_addresses && 'border-destructive')}
                  />
                  {editFormErrors.ip_addresses ? (
                    <p className="text-xs text-destructive">{editFormErrors.ip_addresses}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Comma-separated IPv4, optional CIDR mask /0–32</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                  Tech stack <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Input
                  placeholder="e.g., React, Node.js, PostgreSQL, AWS (comma-separated)"
                  value={editProject.tech_stack}
                  onChange={(e) => {
                    clearEditFieldError('tech_stack');
                    setEditProject({ ...editProject, tech_stack: e.target.value });
                  }}
                  className={cn(editFormErrors.tech_stack && 'border-destructive')}
                />
                {editFormErrors.tech_stack ? (
                  <p className="text-xs text-destructive">{editFormErrors.tech_stack}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Shown on the project overview as tags</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-background',
                          editFormErrors.startDate && 'border-destructive'
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {editStartDate ? format(editStartDate, 'PPP') : 'Select start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={editStartDate}
                        onSelect={(d) => {
                          clearEditFieldError('startDate');
                          setEditStartDate(d);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {editFormErrors.startDate ? (
                    <p className="text-xs text-destructive">{editFormErrors.startDate}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-background',
                          editFormErrors.endDate && 'border-destructive'
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {editEndDate ? format(editEndDate, 'PPP') : 'Select end date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={editEndDate}
                        onSelect={(d) => {
                          clearEditFieldError('endDate');
                          setEditEndDate(d);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {editFormErrors.endDate ? (
                    <p className="text-xs text-destructive">{editFormErrors.endDate}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editProject.status} onValueChange={(v) => setEditProject({ ...editProject, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="gradient-technieum" disabled={isEditing}>
                  {isEditing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Assign Testers Dialog ── */}
        <Dialog open={isAssignDialogOpen} onOpenChange={(open) => {
          setIsAssignDialogOpen(open);
          if (!open) { setSelectedTesters([]); setUserSearchQuery(''); }
        }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader className="space-y-3 pr-8 text-left sm:pr-10">
              <DialogTitle className="space-y-2 text-left text-lg font-semibold leading-snug tracking-tight">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span>Manage Team</span>
                </div>
                {selectedProject && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm font-normal text-muted-foreground sm:text-base">
                    <span className="min-w-0 max-w-full break-words text-foreground">{selectedProject.name}</span>
                    {selectedProject.project_code && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                        <Hash className="h-3 w-3 shrink-0" aria-hidden />
                        {selectedProject.project_code}
                      </span>
                    )}
                  </div>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Current Team ({currentAssignees.length})
                </Label>
                <div className="mt-2 space-y-1.5 min-h-[40px]">
                  {loadingAssignees ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />Loading team members…
                    </div>
                  ) : currentAssignees.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2 px-1">No members assigned yet.</p>
                  ) : (
                    currentAssignees.map((assignee) => {
                      const name = assignee.username || String(assignee.user_id);
                      const isRemoving = removingUserId === assignee.user_id;
                      return (
                        <div key={assignee.user_id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-secondary/40 px-3 py-2 group">
                          <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full gradient-technieum text-xs font-semibold text-primary-foreground">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate text-sm font-medium">{name}</span>
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              Tester
                            </Badge>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAssignee(assignee)}
                            disabled={isRemoving}
                            title="Remove from project"
                            className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground opacity-0 transition-colors hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
                          >
                            {isRemoving
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <><UserMinus className="h-3.5 w-3.5" />Remove</>
                            }
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="border-t border-border/50" />

              <div>
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Add Members
                </Label>
                <div className="relative mt-2 mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search users…"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm bg-secondary/50"
                  />
                </div>

                {selectedTesters.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedTesters.map(id => {
                      const p = profiles.find(pr => pr.id === id);
                      if (!p) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                          {p.username}
                          <button onClick={() => toggleTesterSelection(id)} className="hover:text-destructive transition-colors ml-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="border border-border/50 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {availableProfiles.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      {userSearchQuery ? 'No users match your search' : 'All users are already assigned'}
                    </div>
                  ) : (
                    availableProfiles.map((profile) => {
                      const isSelected = selectedTesters.includes(profile.id);
                      return (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => toggleTesterSelection(profile.id)}
                          className={cn(
                            'flex w-full items-center gap-3 border-b border-border/30 px-3 py-2.5 text-left text-sm transition-colors last:border-0 hover:bg-secondary/60',
                            isSelected && 'bg-primary/5',
                          )}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <div
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all',
                                isSelected ? 'gradient-technieum text-primary-foreground' : 'bg-secondary text-muted-foreground',
                              )}
                            >
                              {profile.username.charAt(0).toUpperCase()}
                            </div>
                            <span className={cn('min-w-0 truncate', isSelected && 'font-medium')}>{profile.username}</span>
                            {profile.role === 'admin' && (
                              <Badge variant="outline" className="shrink-0 text-xs">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                              isSelected ? 'border-primary bg-primary' : 'border-border',
                            )}
                            aria-hidden
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Close</Button>
                <Button
                  className="gradient-technieum inline-flex items-center gap-2"
                  onClick={handleAssignTesters}
                  disabled={isAssigning || selectedTesters.length === 0}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                      <span>Assigning…</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                      <span>
                        Add{selectedTesters.length > 0 ? ` (${selectedTesters.length})` : ''}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirmation ── */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />Delete Project
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong className="text-foreground">{projectToDelete?.name}</strong>
                {projectToDelete?.project_code && (
                  <span className="ml-1 font-mono text-primary">({projectToDelete.project_code})</span>
                )}?
                <br /><br />
                This action cannot be undone. This will permanently remove:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>All findings associated with this project</li>
                  <li>All proof of concept (POC) images</li>
                  <li>All team assignments</li>
                  <li>All checklist progress</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={handleDeleteProject} disabled={isDeleting}>
                {isDeleting
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting…</>
                  : <><Trash2 className="h-4 w-4 mr-2" />Delete Project</>
                }
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </DashboardLayout>
  );
}