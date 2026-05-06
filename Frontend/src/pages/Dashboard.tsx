import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { API as API_BASE } from '@/utils/api';

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

      </div>
    </DashboardLayout>
  );
}