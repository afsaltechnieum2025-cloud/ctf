import { toast } from 'sonner';
import {
  generateTechnicalReport,
  generateManagementReport,
  generateRetestReport,
  generateToipReport,
} from '@/utils/reportGenerator';
import type { ToipTestCase } from '@/data/toipData';
import { authHeaders } from './useProjectData';
import type { Project, Finding, Assignee } from '@/utils/projectTypes';
import { API as API_BASE } from '@/utils/api';


const buildReportProject = (p: Project) => ({
  id: p.id, name: p.name, description: '', client: p.client,
  targetDomain: p.domain || '', targetIPs: p.ip_addresses || [],
  credentials: [], assignedTesters: [], managerId: '',
  status: (p.status || 'active') as 'active' | 'completed' | 'pending' | 'overdue',
  startDate: p.start_date ? new Date(p.start_date) : new Date(),
  endDate: p.end_date ? new Date(p.end_date) : new Date(),
  createdAt: new Date(p.created_at), findings: [],
});

const buildReportFindings = (fList: Finding[], projectId: string) => {
  const sm: Record<string, any> = { critical: 'critical', high: 'high', medium: 'medium', low: 'low', informational: 'info' };
  return fList.map(f => ({
    id: f.id, projectId, title: f.title, description: f.description || '',
    severity: sm[String(f.severity).toLowerCase()] || 'medium', cvssScore: f.cvss_score || 0,
    stepsToReproduce: f.steps_to_reproduce || '', impact: f.impact || '',
    remediation: f.remediation || '',
    affectedAssets: f.affected_component ? [f.affected_component] : [],
    evidence: [] as string[],
    status: (f.status?.toLowerCase() || 'open') as any,
    reportedBy: f.created_by, createdAt: new Date(f.created_at), updatedAt: new Date(f.created_at),
    findingType: f.finding_type || 'pentest',
  }));
};

export function useReports(
  project: Project | null,
  findings: Finding[],
  assignees: Assignee[],
  allUsers: Record<string, string>,
  toipTestCases: ToipTestCase[],
) {
  const pentestFindings = findings.filter(f => (f.finding_type || 'pentest') === 'pentest');
  const sastFindings = findings.filter(f => (f.finding_type || '').toLowerCase() === 'sast');
  const scaFindings = findings.filter(f => {
    const type = (f.finding_type || '').toLowerCase();
    return type === 'sca' || type === 'sast';
  });
  const asmFindings = findings.filter(f => (f.finding_type || '').toLowerCase() === 'asm');
  const llmFindings = findings.filter(f => (f.finding_type || '').toLowerCase() === 'llm');
  const secretFindings = findings.filter(f => (f.finding_type || '').toLowerCase() === 'secret');

  const getTesterNames = () => Array.from(
    new Set(
      assignees
        .filter(a => (a.role ?? 'tester') === 'tester')
        .map(a => allUsers[String(a.user_id)] || a.username || String(a.user_id)),
    ),
  );

  const handleGenerateTechnicalReport = async () => {
    if (!project) return;
    try {
      const pocImages: Record<string, string[]> = {};
      try {
        if (pentestFindings.length > 0) {
          const r = await fetch(
            `${API_BASE}/findings/pocs?finding_ids=${pentestFindings.map(f => f.id).join(',')}`,
            { headers: authHeaders() },
          );
          if (r.ok) {
            const d: any[] = await r.json();
            d.forEach(p => {
              if (!pocImages[p.finding_id]) pocImages[p.finding_id] = [];
              pocImages[p.finding_id].push(p.file_path);
            });
          }
        }
      } catch { }
      toast.info('Generating report…');
      const testerNames = getTesterNames();

      await generateTechnicalReport(
        buildReportProject(project),
        buildReportFindings(pentestFindings, project.id).map(f => ({ ...f, evidence: pocImages[f.id] || [] })),
        pocImages,
        testerNames,
        'Technical',
      );
      toast.success('Technical Report generated!');
    } catch { toast.error('Failed to generate report'); }
  };

  const handleGenerateManagementReport = async () => {
    if (!project) return;
    try {
      await generateManagementReport(buildReportProject(project), buildReportFindings(pentestFindings, project.id));
      toast.success('Management Report generated!');
    } catch { toast.error('Failed to generate report'); }
  };

  const handleGenerateRetestReport = async () => {
    if (!project) return;
    try {
      await generateRetestReport(buildReportProject(project), findings.map(f => ({
        id: f.id, title: f.title, severity: String(f.severity).toLowerCase(),
        status: f.status || 'Open', retest_status: f.retest_status, retest_date: f.retest_date,
      })));
      toast.success('Retest Report generated!');
    } catch { toast.error('Failed to generate retest report'); }
  };

  const buildPocMapFor = async (list: Finding[]) => {
    const pocImages: Record<string, string[]> = {};
    if (list.length === 0) return pocImages;
    try {
      const r = await fetch(
        `${API_BASE}/findings/pocs?finding_ids=${list.map(f => f.id).join(',')}`,
        { headers: authHeaders() },
      );
      if (r.ok) {
        const d: any[] = await r.json();
        d.forEach(p => {
          if (!pocImages[p.finding_id]) pocImages[p.finding_id] = [];
          pocImages[p.finding_id].push(p.file_path);
        });
      }
    } catch { }
    return pocImages;
  };

  const handleGenerateSastReport = async () => {
    if (!project) return;
    try {
      toast.info('Generating SAST report…');
      const pocImages = await buildPocMapFor(sastFindings);
      await generateTechnicalReport(
        buildReportProject(project),
        buildReportFindings(sastFindings, project.id).map(f => ({ ...f, evidence: pocImages[f.id] || [] })),
        pocImages,
        getTesterNames(),
        'SAST',
      );
      toast.success('SAST Report generated!');
    } catch { toast.error('Failed to generate SAST report'); }
  };

  const handleGenerateScaReport = async () => {
    if (!project) return;
    try {
      toast.info('Generating SCA report…');
      const pocImages = await buildPocMapFor(scaFindings);
      await generateTechnicalReport(
        buildReportProject(project),
        buildReportFindings(scaFindings, project.id).map(f => ({ ...f, evidence: pocImages[f.id] || [] })),
        pocImages,
        getTesterNames(),
        'SCA',
      );
      toast.success('SCA Report generated!');
    } catch { toast.error('Failed to generate SCA report'); }
  };

  const handleGenerateAsmReport = async () => {
    if (!project) return;
    try {
      toast.info('Generating ASM report…');
      const pocImages = await buildPocMapFor(asmFindings);
      await generateTechnicalReport(
        buildReportProject(project),
        buildReportFindings(asmFindings, project.id).map(f => ({ ...f, evidence: pocImages[f.id] || [] })),
        pocImages,
        getTesterNames(),
        'ASM',
      );
      toast.success('ASM Report generated!');
    } catch { toast.error('Failed to generate ASM report'); }
  };

  const handleGenerateLlmReport = async () => {
    if (!project) return;
    try {
      toast.info('Generating LLM report…');
      const pocImages = await buildPocMapFor(llmFindings);
      await generateTechnicalReport(
        buildReportProject(project),
        buildReportFindings(llmFindings, project.id).map(f => ({ ...f, evidence: pocImages[f.id] || [] })),
        pocImages,
        getTesterNames(),
        'LLM',
      );
      toast.success('LLM Report generated!');
    } catch { toast.error('Failed to generate LLM report'); }
  };

  const handleGenerateSecretReport = async () => {
    if (!project) return;
    try {
      toast.info('Generating Secret Detection report…');
      const pocImages = await buildPocMapFor(secretFindings);
      await generateTechnicalReport(
        buildReportProject(project),
        buildReportFindings(secretFindings, project.id).map(f => ({ ...f, evidence: pocImages[f.id] || [] })),
        pocImages,
        getTesterNames(),
        'Secret',
      );
      toast.success('Secret Detection Report generated!');
    } catch { toast.error('Failed to generate Secret report'); }
  };

  const handleGenerateToipReport = async () => {
    if (!project) return;
    if (toipTestCases.length === 0) {
      toast.error('No TOIP test cases to export');
      return;
    }
    try {
      toast.info('Generating TOIP report…');
      await generateToipReport(
        buildReportProject(project),
        toipTestCases.map(tc => ({
          category: tc.category,
          title: tc.title,
          description: tc.description,
          severity: tc.severity,
          status: tc.status,
        })),
        getTesterNames(),
      );
      toast.success('TOIP Report generated!');
    } catch {
      toast.error('Failed to generate TOIP report');
    }
  };

  return {
    handleGenerateTechnicalReport,
    handleGenerateManagementReport,
    handleGenerateRetestReport,
    handleGenerateSastReport,
    handleGenerateScaReport,
    handleGenerateAsmReport,
    handleGenerateLlmReport,
    handleGenerateSecretReport,
    handleGenerateToipReport,
  };
}