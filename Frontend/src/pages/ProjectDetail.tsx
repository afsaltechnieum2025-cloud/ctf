import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2,
  ArrowLeft,
  CheckSquare,
  Network,
  GitBranch,
  LayoutDashboard,
  ShieldAlert,
  Users,
  FileText,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

// ── Hooks & utils ──
import { useProjectData } from '@/hooks/useProjectData';
import { useReports } from '@/hooks/useReports';

// ── Tab components ──
import OverviewTab from '@/components/project/tabs/OverviewTab';
import FindingsTab from '@/components/project/tabs/FindingsTab';
import TeamTab from '@/components/project/tabs/TeamTab';
import ReportsTab from '@/components/project/tabs/ReportsTab';
import ChecklistTab from '@/components/project/tabs/ChecklistTab';
import ArchitectureTab from '@/components/project/tabs/ArchitectureTab';
import LogicFlowTab from '@/components/project/tabs/LogicFlowTab';

// ── Types ──
import { createInitialToipTestCases } from '@/data/toipData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d: string | null) => {
  if (!d) return 'Not set';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

/** Matches trending page category tabs — pill bar + active border/fill */
const projectTabTriggerClass =
  'group shrink-0 flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground shadow-none transition-all duration-200 whitespace-nowrap hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none';

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectDetail() {
  const { id } = useParams();
  const { role, user } = useAuth();
  const userId = (user?.id ?? '') as string;

  const {
    project, findings, assignees, allUsers, pocs, isLoading, isUpdatingStatus,
    clProgress, clSaving, checklistDetails,
    getUsername, fetchProjectData, handleUpdateStatus, toggleItem,
    addFinding, addPocs, deleteFinding, addSinglePoc, removePoc, updateFinding,
  } = useProjectData(id, userId);

  const [toipTestCases, setToipTestCases] = useState(createInitialToipTestCases);

  const {
    handleGenerateTechnicalReport,
    handleGenerateManagementReport,
    handleGenerateRetestReport,
    handleGenerateSastReport,
    handleGenerateScaReport,
    handleGenerateAsmReport,
    handleGenerateLlmReport,
    handleGenerateSecretReport,
    handleGenerateToipReport,
  } = useReports(project, findings, assignees, allUsers, toipTestCases);

  // ── Lifted arch state — persists across tab switches (components live in DB via ArchitectureTab hook) ──
  const [archStage, setArchStage] = useState<'upload' | 'map'>('upload');
  const [archCompanyName, setArchCompanyName] = useState('');
  const [archSummary, setArchSummary] = useState('');

  const getFindingsByType = (type: any) => findings.filter(f => (f.finding_type || 'pentest') === type);

  const isProjectAssignee = assignees.some(a => String(a.user_id) === String(userId));
  const findingsModerator = role === 'admin' || role === 'manager';
  const canUpdateRetestOnProject = findingsModerator || isProjectAssignee;

  // ── Loading state ──
  if (isLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Not found ──
  if (!project) {
    return (
      <DashboardLayout title="Project Not Found">
        <Card className="p-12 text-center">
          <p className="text-lg font-medium">Project not found</p>
          <Link to="/projects">
            <Button variant="outline" className="mt-4"><ArrowLeft className="h-4 w-4 mr-2" />Back to Projects</Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  // ── Main render ──
  return (
    <DashboardLayout title={project.name} description={project.client}>
      <div className="space-y-4 sm:space-y-6">
        <Link to="/projects">
          <Button variant="ghost" size="sm" className="-ml-2 sm:ml-0">
            <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />Back to Projects
          </Button>
        </Link>

        {/* Status row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {getStatusBadge(project.status)}
            {(role === 'admin' || role === 'manager') && (
            <Select value={project.status || 'pending'} onValueChange={handleUpdateStatus} disabled={isUpdatingStatus}>
              <SelectTrigger className="h-8 w-full min-w-0 text-xs bg-secondary/50 sm:w-40">
                {isUpdatingStatus
                  ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Updating…</span>
                  : <SelectValue placeholder="Change status" />
                }
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            )}
          </div>
          <span className="text-muted-foreground text-xs sm:text-sm break-words">
            {formatDate(project.start_date)} – {formatDate(project.end_date)}
          </span>
        </div>

        {/* Tabs — same pill pattern as trending category tabs */}
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="flex h-auto w-full max-w-full flex-nowrap justify-start gap-1 overflow-x-auto overscroll-x-contain rounded-lg bg-secondary/40 p-1 [-webkit-overflow-scrolling:touch] scrollbar-hide">
            <TabsTrigger value="overview" className={projectTabTriggerClass}>
              <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-foreground" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="findings" className={projectTabTriggerClass}>
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-foreground" />
              Findings
              <span className="ml-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-xs font-semibold text-muted-foreground group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary">
                {findings.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="team" className={projectTabTriggerClass}>
              <Users className="h-3.5 w-3.5 shrink-0 text-foreground" />
              Team
              <span className="ml-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-xs font-semibold text-muted-foreground group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary">
                {assignees.length > 0 ? assignees.length : (project?.assignees_count ?? 0)}
              </span>
            </TabsTrigger>
            {(role === 'admin' || role === 'manager') && (
              <TabsTrigger value="reports" className={projectTabTriggerClass}>
                <FileText className="h-3.5 w-3.5 shrink-0 text-foreground" />
                Reports
              </TabsTrigger>
            )}
            <TabsTrigger value="checklist" className={projectTabTriggerClass}>
              <CheckSquare className="h-3.5 w-3.5 shrink-0 text-foreground" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="architecture" className={projectTabTriggerClass}>
              <Network className="h-3.5 w-3.5 shrink-0 text-foreground" />
              Architecture
            </TabsTrigger>
            <TabsTrigger value="logic-flow" className={projectTabTriggerClass}>
              <GitBranch className="h-3.5 w-3.5 shrink-0 text-foreground" />
              Logic & flow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab
              project={project}
              findings={findings}
              assignees={assignees}
              pocs={pocs}
              allUsers={allUsers}
              getUsername={getUsername}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>

          <TabsContent value="findings" className="space-y-4">
            <FindingsTab
              findings={findings}
              pocs={pocs}
              projectId={project.id}
              projectName={project.name}
              userId={userId}
              getUsername={getUsername}
              onFindingAdded={(finding, newPocs) => { addFinding(finding); addPocs(finding.id, newPocs); }}
              onFindingDeleted={deleteFinding}
              onPocAdded={addSinglePoc}
              onPocRemoved={removePoc}
              onFindingUpdated={updateFinding}
              onRefresh={fetchProjectData}
              toipTestCases={toipTestCases}
              setToipTestCases={setToipTestCases}
              isModerator={findingsModerator}
              canUpdateRetest={canUpdateRetestOnProject}
            />
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <TeamTab assignees={assignees} findings={findings} allUsers={allUsers} />
          </TabsContent>

          {(role === 'admin' || role === 'manager') && (
            <TabsContent value="reports" className="space-y-4">
              <ReportsTab
                findings={findings}
                getFindingsByType={getFindingsByType}
                onGenerateTechnical={handleGenerateTechnicalReport}
                onGenerateManagement={handleGenerateManagementReport}
                onGenerateRetest={handleGenerateRetestReport}
                onGenerateSast={handleGenerateSastReport}
                onGenerateSca={handleGenerateScaReport}
                onGenerateAsm={handleGenerateAsmReport}
                onGenerateLlm={handleGenerateLlmReport}
                onGenerateSecret={handleGenerateSecretReport}
                onGenerateToip={handleGenerateToipReport}
                toipTestCaseCount={toipTestCases.length}
              />
            </TabsContent>
          )}

          <TabsContent value="checklist" className="space-y-4">
            <ChecklistTab
              clProgress={clProgress}
              clSaving={clSaving}
              checklistDetails={checklistDetails}
              getUsername={getUsername}
              onToggleItem={toggleItem}
            />
          </TabsContent>

          <TabsContent value="architecture" className="space-y-6">
            <ArchitectureTab
              projectId={project.id}
              stage={archStage}
              setStage={setArchStage}
              companyName={archCompanyName}
              setCompanyName={setArchCompanyName}
              summary={archSummary}
              setSummary={setArchSummary}
            />
          </TabsContent>

          <TabsContent value="logic-flow" className="space-y-4">
            <LogicFlowTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}