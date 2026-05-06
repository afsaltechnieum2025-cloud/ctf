import { useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  FolderKanban,
  Bug,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Download,
  Eye,
  Loader2,
  FileText,
  Shield,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import { API as API_BASE, docsPdfUrl } from '@/utils/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';

interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
  findings_count: number;
  critical_count: number;
  high_count?: number;
  medium_count?: number;
  low_count?: number;
  info_count?: number;
  assignees_count: number;
  assignedTesters?: string[];
}

interface Finding {
  id: string;
  project_id: string;
  title: string;
  severity: string | number;
  status: string | null;
  created_at: string;
}

interface TeamMember {
  id: number;
  username: string;
  role: string | null;
  full_name: string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token') ?? '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ─── Severity normalization ───────────────────────────────────────────────────

const normalizeSeverity = (s: string | number | null | undefined): Severity => {
  const map: Record<string, Severity> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    informational: 'Informational',
    info: 'Informational',
  };
  const raw = String(s ?? '').toLowerCase().trim();
  if (map[raw]) return map[raw];
  const n = parseFloat(raw);
  if (!isNaN(n) && raw !== '') {
    if (n >= 9.0) return 'Critical';
    if (n >= 7.0) return 'High';
    if (n >= 4.0) return 'Medium';
    return 'Low';
  }
  return 'Informational';
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, role, username } = useAuth();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allFindings, setAllFindings] = useState<Finding[]>([]);
  const [isLoadingFindings, setIsLoadingFindings] = useState(false);

  // ─── Expand/collapse state ──────────────────────────────────────────────────
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);

  /** In-app PDF preview (avoids blank-tab + cross-origin blob navigation issues). */
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const pdfPreviewGenRef = useRef(0);

  const MEMBERS_LIMIT = 4;
  const PROJECTS_LIMIT = 4;

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchTeamMembers();
    }
  }, [user]);

  // ─── Fetch projects ─────────────────────────────────────────────────────────

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/projects`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data: Project[] = await res.json();
      console.debug('[Dashboard] Current user from AuthContext:', JSON.stringify(user));
      console.debug('[Dashboard] Raw projects from API:', JSON.stringify(data));
      data.forEach(p => {
        console.debug(`[Dashboard] Project "${p.name}" assignedTesters:`, JSON.stringify(p.assignedTesters));
      });
      setProjects(data);
      fetchAllFindings(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  };

  // ─── Fetch ALL findings ──────────────────────────────────────────────────────

  const fetchAllFindings = async (projectList: Project[]) => {
    if (!projectList.length) return;
    setIsLoadingFindings(true);
    try {
      const fetches = projectList.map(p =>
        fetch(`${API_BASE}/findings?project_id=${p.id}`, { headers: authHeaders() })
          .then(r => r.ok ? r.json() : [])
          .catch(() => [])
      );
      const results: Finding[][] = await Promise.all(fetches);
      setAllFindings(results.flat());
    } catch (error) {
      console.error('Error fetching findings:', error);
    } finally {
      setIsLoadingFindings(false);
    }
  };

  // ─── Fetch team members ─────────────────────────────────────────────────────

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data: TeamMember[] = await res.json();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members');
    }
  };

  // ─── Doc URL map ─────────────────────────────────────────────────────────────

  const docMap: Record<string, string> = {
    AD: docsPdfUrl('AD'),
  };

  // ─── Preview (modal — reliable; new-tab + blob after async is often blocked → about:blank)

  const closePdfPreview = () => {
    pdfPreviewGenRef.current += 1;
    setPdfBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPdfDialogOpen(false);
    setPdfLoading(false);
  };

  const handlePreview = async (docKey: string) => {
    const filePath = docMap[docKey];
    if (!filePath) return;

    const gen = ++pdfPreviewGenRef.current;
    setPdfTitle(docKey);
    setPdfDialogOpen(true);
    setPdfLoading(true);
    setPdfBlobUrl(null);

    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (pdfPreviewGenRef.current !== gen) {
        URL.revokeObjectURL(url);
        return;
      }
      setPdfBlobUrl(url);
    } catch (error) {
      if (pdfPreviewGenRef.current === gen) {
        console.error('Preview error:', error);
        toast.error(`Failed to preview ${docKey} documentation`);
        closePdfPreview();
      }
    } finally {
      if (pdfPreviewGenRef.current === gen) setPdfLoading(false);
    }
  };

  // ─── Download (blob fetch) ────────────────────────────────────────────────────

  const handleDownload = async (docKey: string) => {
    const filePath = docMap[docKey];
    if (!filePath) return;
    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${docKey}_Documentation.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success(`${docKey} documentation downloaded`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${docKey} documentation`);
    }
  };

  // ─── Role helpers ─────────────────────────────────────────────────────────────
  // Admin and Manager both see ALL data; only Tester sees filtered/assigned data
  const isAdminOrManager = role === 'admin' || role === 'manager';

  // ─── Tester assignment check ──────────────────────────────────────────────────
  // Compares against both string and number forms of user.id to handle API type mismatches
  const isAssignedToProject = (project: Project): boolean => {
    if (!user || !project.assignedTesters) {
      console.debug('[Dashboard] isAssignedToProject: no user or no assignedTesters', {
        user,
        projectId: project.id,
        assignedTesters: project.assignedTesters,
      });
      return false;
    }
    const userId = user.id;
    const match = project.assignedTesters.some(t => String(t) === String(userId));
    console.debug('[Dashboard] isAssignedToProject check', {
      projectId: project.id,
      projectName: project.name,
      assignedTesters: project.assignedTesters,
      userId,
      userIdType: typeof userId,
      match,
    });
    return match;
  };

  // ─── userFindings: admin+manager see all, tester sees only assigned ───────────

  const userFindings = useMemo(() => {
    if (isAdminOrManager) return allFindings;
    const assignedProjectIds = new Set(
      projects.filter(isAssignedToProject).map(p => p.id)
    );
    return allFindings.filter(f => assignedProjectIds.has(f.project_id));
  }, [user, role, projects, allFindings]);

  // ─── Derived stats ────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    // Admin + Manager → all projects; Tester → only assigned projects
    const userProjects = isAdminOrManager
      ? projects
      : projects.filter(isAssignedToProject);

    const criticalFindings = userFindings.filter(f => normalizeSeverity(f.severity) === 'Critical').length;
    const highFindings     = userFindings.filter(f => normalizeSeverity(f.severity) === 'High').length;
    const mediumFindings   = userFindings.filter(f => normalizeSeverity(f.severity) === 'Medium').length;
    const lowFindings      = userFindings.filter(f => normalizeSeverity(f.severity) === 'Low').length;
    const infoFindings     = userFindings.filter(f => normalizeSeverity(f.severity) === 'Informational').length;

    return {
      totalProjects:     userProjects.length,
      activeProjects:    userProjects.filter(p => p.status === 'active').length,
      completedProjects: userProjects.filter(p => p.status === 'completed').length,
      overdueProjects:   userProjects.filter(p => p.status === 'overdue').length,
      totalFindings:     userFindings.length,
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      infoFindings,
    };
  }, [user, role, projects, userFindings]);

  // ─── Chart data ───────────────────────────────────────────────────────────────

  const severityData = [
    { name: 'Critical', value: stats.criticalFindings, color: 'hsl(var(--critical))' },
    { name: 'High', value: stats.highFindings, color: 'hsl(var(--high))' },
    { name: 'Medium', value: stats.mediumFindings, color: 'hsl(var(--medium))' },
    { name: 'Low', value: stats.lowFindings, color: 'hsl(var(--low))' },
    { name: 'Informational', value: stats.infoFindings, color: 'hsl(var(--muted-foreground))' },
  ];

  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; findings: number; projects: Set<string> }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    userFindings.forEach(f => {
      const d = new Date(f.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!months[key]) {
        months[key] = { month: monthNames[d.getMonth()], findings: 0, projects: new Set() };
      }
      months[key].findings++;
      months[key].projects.add(f.project_id);
    });

    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 4 + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const entry = months[key];
      return {
        month: monthNames[d.getMonth()],
        findings: entry?.findings ?? 0,
        projects: entry ? entry.projects.size : 0,
      };
    });
  }, [userFindings]);

  // ─── Visible projects: admin+manager see all, tester sees only assigned ───────

  const visibleProjects = useMemo(() => {
    if (isAdminOrManager) return projects;
    return projects.filter(isAssignedToProject);
  }, [user, role, projects]);

  const getProjectFindingCount = (projectId: string) =>
    allFindings.filter(f => f.project_id === projectId).length;

  const capitalizeRole = (r: string | null): string => {
    if (!r) return 'User';
    return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
  };

  // ─── Status badge helper ──────────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
          completed
        </Badge>
      );
    }
    const variants: Record<string, 'active' | 'pending' | 'overdue' | 'secondary'> = {
      active: 'active',
      pending: 'pending',
      overdue: 'overdue',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout
      title={`Welcome back, ${username || 'User'}`}
      description="Here's an overview of your pentest operations"
    >
      <div className="space-y-6">

        {/* ── Stats Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card glow className="animate-fade-in" style={{ animationDelay: '0ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalProjects}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FolderKanban className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-sm">
                <Badge variant="active">{stats.activeProjects} Active</Badge>
              </div>
            </CardContent>
          </Card>

          <Card glow className="animate-fade-in" style={{ animationDelay: '50ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Findings</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalFindings}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Bug className="h-6 w-6 text-orange-500" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-sm">
                <Badge variant="critical">{stats.criticalFindings} Critical</Badge>
                <Badge variant="high">{stats.highFindings} High</Badge>
              </div>
            </CardContent>
          </Card>

          <Card glow className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold mt-1">{stats.completedProjects}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>On track this month</span>
              </div>
            </CardContent>
          </Card>

          <Card glow className="animate-fade-in" style={{ animationDelay: '150ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-3xl font-bold mt-1">{stats.overdueProjects}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
                <Clock className="h-4 w-4" />
                <span>Requires attention</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Severity Breakdown ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(
            [
              { label: 'Critical', count: stats.criticalFindings, bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' },
              { label: 'High', count: stats.highFindings, bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' },
              { label: 'Medium', count: stats.mediumFindings, bg: 'bg-orange-400/10', text: 'text-orange-400', border: 'border-orange-400/30' },
              { label: 'Low', count: stats.lowFindings, bg: 'bg-primary/5', text: 'text-primary/50', border: 'border-primary/15' },
              { label: 'Informational', count: stats.infoFindings, bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
            ] as const
          ).map(({ label, count, bg, text, border }) => (
            <Card key={label} className={`p-4 border ${border} ${bg} animate-fade-in`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${text}`}>{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <AlertTriangle className={`h-5 w-5 ${text}`} />
              </div>
            </Card>
          ))}
        </div>

        {/* ── Charts Row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="text-lg">Findings by Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--chart-tooltip-bg))',
                        border: '1px solid hsl(var(--chart-tooltip-border))',
                        borderRadius: '8px',
                      }}
                      itemStyle={{ color: 'hsl(var(--chart-tooltip-fg))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                {severityData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '250ms' }}>
            <CardHeader>
              <CardTitle className="text-lg">Findings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorFindings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-series-accent))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-series-accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                    <XAxis dataKey="month" stroke="hsl(var(--chart-axis))" />
                    <YAxis stroke="hsl(var(--chart-axis))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--chart-tooltip-bg))',
                        border: '1px solid hsl(var(--chart-tooltip-border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="findings"
                      stroke="hsl(var(--chart-series-accent))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorFindings)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Recent Projects & Team ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Projects */}
          {/* <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <CardTitle className="text-lg">Recent Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {visibleProjects.length > 0 ? (
                <>
                  <div
                    className="space-y-3 overflow-y-auto"
                    style={{
                      maxHeight: showAllProjects ? '320px' : 'none',
                      scrollbarGutter: 'stable',
                      paddingRight: '2px',
                    }}
                  >
                    {(showAllProjects
                      ? visibleProjects
                      : visibleProjects.slice(0, PROJECTS_LIMIT)
                    ).map((project) => (
                      <div
                        key={project.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{project.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{project.client}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusBadge(project.status)}
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {getProjectFindingCount(project.id)} findings
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {visibleProjects.length > PROJECTS_LIMIT && (
                    <button
                      onClick={() => setShowAllProjects(prev => !prev)}
                      className="w-full text-sm text-muted-foreground hover:text-primary transition-colors py-1.5 text-center"
                    >
                      {showAllProjects
                        ? 'Show less'
                        : `+${visibleProjects.length - PROJECTS_LIMIT} more projects`}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <FolderKanban className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">No projects assigned to you yet.</p>
                </div>
              )}
            </CardContent>
          </Card> */}

          {/* Team Members — admin and manager only */}
          {/* {isAdminOrManager && (
            <Card className="animate-fade-in" style={{ animationDelay: '550ms' }}>
              <CardHeader>
                <CardTitle className="text-lg">Team Members</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {teamMembers.length > 0 ? (
                  <>
                    <div
                      className="space-y-3 overflow-y-auto"
                      style={{
                        maxHeight: showAllMembers ? '320px' : 'none',
                        scrollbarGutter: 'stable',
                        paddingRight: '2px',
                      }}
                    >
                      {(showAllMembers
                        ? teamMembers
                        : teamMembers.slice(0, MEMBERS_LIMIT)
                      ).map((member) => {
                        const safeUsername = (member.username ?? member.full_name ?? '')
                          .replace(/<[^>]*>/g, '')
                          .replace(/[&<>"'`]/g, '')
                          .trim();

                        if (!safeUsername) return null;

                        const avatarChar = safeUsername.charAt(0).toUpperCase();
                        const roleLower = (member.role ?? 'user').toLowerCase();
                        const displayRole = capitalizeRole(member.role);

                        const roleStyles: Record<string, string> = {
                          admin: 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30',
                          manager: 'bg-primary/15 text-primary border-primary/40',
                          tester: 'bg-secondary text-muted-foreground border-border',
                          user: 'bg-secondary text-muted-foreground border-border',
                        };

                        return (
                          <div
                            key={member.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
                          >
                            <div
                              className="rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0"
                              style={{ width: '36px', height: '36px' }}
                            >
                              {avatarChar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate" title={safeUsername}>
                                {safeUsername}
                              </p>
                            </div>
                            <div className="shrink-0">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleStyles[roleLower] ?? roleStyles.user}`}>
                                {displayRole}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {teamMembers.length > MEMBERS_LIMIT && (
                      <button
                        onClick={() => setShowAllMembers(prev => !prev)}
                        className="w-full text-sm text-muted-foreground hover:text-primary transition-colors py-1.5 text-center"
                      >
                        {showAllMembers
                          ? 'Show less'
                          : `+${teamMembers.length - MEMBERS_LIMIT} more members`}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">No team members found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )} */}

        </div>

        {/* ── Documentation Section — all roles ───────────────────────────── */}
        <Card
          className="animate-fade-in overflow-hidden border-orange-500/20 bg-card/90 shadow-sm"
          style={{ animationDelay: '300ms' }}
        >
          <CardHeader className="relative border-b border-orange-500/10 bg-gradient-to-r from-orange-500/[0.08] via-primary/[0.04] to-transparent pb-6 pt-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-sm">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Technieum Offensive Security Tools
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Official PDF guides for each capability—preview in the browser or download for offline use.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { title: 'AD Suite', subtitle: 'Active Directory Pentesting', icon: Shield, docKey: 'AD' },
              ].map((doc, index) => {
                const Icon = doc.icon;
                return (
                  <div
                    key={doc.title}
                    className="group relative flex flex-col rounded-xl border border-border/70 bg-card/95 p-4 shadow-sm transition-all duration-300 animate-fade-in hover:border-primary/30 hover:shadow-md"
                    style={{ animationDelay: `${320 + index * 40}ms` }}
                  >
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r from-orange-400/0 via-primary/50 to-orange-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      aria-hidden
                    />
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/[0.08] text-primary transition-colors group-hover:border-orange-500/35 group-hover:bg-orange-500/[0.12]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="shrink-0 border-border/80 bg-muted/40 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        <FileText className="mr-1 h-3 w-3" />
                        PDF
                      </Badge>
                    </div>
                    <div className="mt-3 min-w-0 flex-1 space-y-0.5">
                      <h3 className="font-semibold leading-tight text-foreground">{doc.title}</h3>
                      <p className="text-xs leading-snug text-muted-foreground">{doc.subtitle}</p>
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        title="Preview PDF"
                        onClick={() => handlePreview(doc.docKey)}
                        className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border/80 bg-secondary/40 text-foreground transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <Eye className="h-4 w-4 shrink-0" />
                        <span className="sr-only">Preview PDF</span>
                      </button>
                      <button
                        type="button"
                        title="Download PDF"
                        onClick={() => handleDownload(doc.docKey)}
                        className="inline-flex h-9 w-full items-center justify-center rounded-md text-sm font-medium gradient-technieum text-primary-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <Download className="h-4 w-4 shrink-0" />
                        <span className="sr-only">Download PDF</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>

      <Dialog
        open={pdfDialogOpen}
        onOpenChange={(open) => {
          if (!open) closePdfPreview();
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,900px)] w-[min(96vw,1200px)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="shrink-0 border-b px-6 py-4 pr-14">
            <DialogTitle>{pdfTitle} — Documentation</DialogTitle>
          </DialogHeader>
          <div className="relative min-h-[60vh] flex-1 bg-muted/30">
            {pdfLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
                <span className="text-sm">Loading PDF…</span>
              </div>
            )}
            {!pdfLoading && pdfBlobUrl ? (
              <iframe
                title="PDF preview"
                src={pdfBlobUrl}
                className="h-[min(75vh,800px)] w-full border-0"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}