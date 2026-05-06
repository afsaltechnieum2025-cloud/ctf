import { useState, useEffect, useRef, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Trash2,
  Pencil,
  Upload,
  Image as ImageIcon,
  X,
  RefreshCw,
  Loader2,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { API as API_BASE } from '@/utils/api';
import { cn } from '@/lib/utils';
import { SEVERITY_STAT_CARD_STYLES, SeverityStatCardIcon } from '@/utils/severityHelpers';

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
type RetestStatus = 'Open' | 'Fixed' | 'Not Fixed';

interface Finding {
  id: string;
  project_id: string;
  title: string;
  severity: Severity;
  description: string | null;
  impact: string | null;
  remediation: string | null;
  steps_to_reproduce: string | null;
  affected_component: string | null;
  cvss_score: number | null;
  cwe_id: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  retest_status: string | null;
  retest_date: string | null;
  retest_notes: string | null;
  retested_by: string | null;
}

interface FindingPoc {
  id: string;
  finding_id: string;
  file_path: string;
  file_name: string;
  uploaded_by: string;
  uploaded_at: string;
}

interface Project {
  id: string;
  name: string;
  client: string;
  assignedTesters?: string[];
}

interface Assignee {
  id: string;
  user_id: string;
  username: string;
}

// ─── Add-finding form validation ─────────────────────────────────────────────

type FindingFormErrors = Partial<
  Record<
    | 'projectId'
    | 'severity'
    | 'title'
    | 'description'
    | 'cvssScore'
    | 'affectedComponent'
    | 'cweId'
    | 'stepsToReproduce'
    | 'impact'
    | 'remediation',
    string
  >
>;

type FindingFormFields = {
  projectId: string;
  severity: Severity | '';
  title: string;
  description: string;
  stepsToReproduce: string;
  impact: string;
  remediation: string;
  affectedComponent: string;
  cvssScore: string;
  cweId: string;
};

const RE_FINDING_TITLE = /^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F]{3,300}$/;
const RE_FINDING_DESCRIPTION = /^[^\x00]{10,20000}$/;
const RE_FINDING_TEXT_OPTIONAL = /^[^\x00]{1,20000}$/;
const RE_AFFECTED_COMPONENT = /^[\p{L}\p{N}_\s./:\\?#=&%\[\]{}(),+@-]{1,500}$/u;
const RE_CWE_ID = /^CWE-\d{1,5}$/i;
const RE_CVSS_SCORE = /^(?:10(?:\.0{1,3})?|[0-9](?:\.\d{1,3})?)$/;

function validateFindingForm(fields: FindingFormFields): FindingFormErrors {
  const errors: FindingFormErrors = {};

  if (!fields.projectId.trim()) errors.projectId = 'Select a project.';
  if (!fields.severity) errors.severity = 'Select a severity.';

  const title = fields.title.trim();
  if (!title) errors.title = 'Title is required.';
  else if (!RE_FINDING_TITLE.test(title)) {
    errors.title = 'Use 3–300 characters; leading/trailing spaces trimmed; no control characters.';
  }

  const description = fields.description.trim();
  if (!description) errors.description = 'Description is required.';
  else if (!RE_FINDING_DESCRIPTION.test(description)) {
    errors.description = 'Use 10–20,000 characters (no null bytes).';
  }

  const cvss = fields.cvssScore.trim();
  if (cvss) {
    if (!RE_CVSS_SCORE.test(cvss)) {
      errors.cvssScore = 'Enter a number from 0 to 10 (e.g., 7.5 or 10).';
    } else {
      const n = parseFloat(cvss);
      if (Number.isNaN(n) || n < 0 || n > 10) {
        errors.cvssScore = 'CVSS must be between 0 and 10.';
      }
    }
  }

  const ac = fields.affectedComponent.trim();
  if (ac && !RE_AFFECTED_COMPONENT.test(ac)) {
    errors.affectedComponent =
      'Use 1–500 characters: letters, numbers, paths, and common URL symbols.';
  }

  const cwe = fields.cweId.trim();
  if (cwe && !RE_CWE_ID.test(cwe)) {
    errors.cweId = 'Use CWE format, e.g., CWE-79.';
  }

  const steps = fields.stepsToReproduce.trim();
  if (steps && !RE_FINDING_TEXT_OPTIONAL.test(steps)) {
    errors.stepsToReproduce = 'Use 1–20,000 characters (no null bytes).';
  }

  const impact = fields.impact.trim();
  if (impact && !RE_FINDING_TEXT_OPTIONAL.test(impact)) {
    errors.impact = 'Use 1–20,000 characters (no null bytes).';
  }

  const rem = fields.remediation.trim();
  if (rem && !RE_FINDING_TEXT_OPTIONAL.test(rem)) {
    errors.remediation = 'Use 1–20,000 characters (no null bytes).';
  }

  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Findings() {
  const { user, role } = useAuth();
  const userId = (user?.id ?? '') as string;

  // Admin + Manager see everything; Tester sees only assigned projects
  const isAdminOrManager = role === 'admin' || role === 'manager';

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);

  const [allFindings, setAllFindings] = useState<Finding[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [assigneeMap, setAssigneeMap] = useState<Record<string, Assignee[]>>({});
  const [userNameById, setUserNameById] = useState<Record<string, string>>({});
  const [pocs, setPocs] = useState<Record<string, FindingPoc[]>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingFindingId, setDeletingFindingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<FindingFormFields | null>(null);
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [editFormErrors, setEditFormErrors] = useState<FindingFormErrors>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFindingId, setUploadingFindingId] = useState<string | null>(null);

  const formPocInputRef = useRef<HTMLInputElement>(null);
  const [pendingPocs, setPendingPocs] = useState<{ file: File; preview: string }[]>([]);

  const [formData, setFormData] = useState({
    projectId: '',
    severity: '' as Severity | '',
    title: '',
    description: '',
    stepsToReproduce: '',
    impact: '',
    remediation: '',
    affectedComponent: '',
    cvssScore: '',
    cweId: '',
  });

  const [findingFormErrors, setFindingFormErrors] = useState<FindingFormErrors>({});

  const clearFindingFieldError = (key: keyof FindingFormErrors) => {
    setFindingFormErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearEditFieldError = (key: keyof FindingFormErrors) => {
    setEditFormErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleAddFindingDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setFindingFormErrors({});
  };

  // ─── Auth headers ─────────────────────────────────────────────────────────────

  const authHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const authHeadersNoContent = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // ─── Role-filtered projects & findings ───────────────────────────────────────

  // Projects visible to this user
  const visibleProjects = useMemo(() => {
    if (isAdminOrManager) return allProjects;
    return allProjects.filter(p =>
      p.assignedTesters?.some(t => String(t) === String(userId))
    );
  }, [isAdminOrManager, allProjects, userId]);

  // Findings scoped to visible projects only
  const findings = useMemo(() => {
    const visibleIds = new Set(visibleProjects.map(p => p.id));
    return allFindings.filter(f => visibleIds.has(f.project_id));
  }, [allFindings, visibleProjects]);

  // Projects shown in the "Add Finding" form dropdown
  // Testers can only add findings to their assigned projects
  const formProjects = visibleProjects;

  // ─── Data Fetching ────────────────────────────────────────────────────────────

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const userMap: Record<string, string> = {};
      try {
        const ur = await fetch(`${API_BASE}/users`, { headers: authHeaders() });
        if (ur.ok) {
          const ud: { id: string | number; username?: string; name?: string; email?: string }[] = await ur.json();
          ud.forEach((u) => {
            userMap[String(u.id)] = u.username || u.name || u.email || String(u.id);
          });
        }
      } catch {
        /* non-fatal */
      }
      setUserNameById(userMap);

      const projectsRes = await fetch(`${API_BASE}/projects`, { headers: authHeaders() });
      const projectsData: Project[] = projectsRes.ok ? await projectsRes.json() : [];
      setAllProjects(projectsData);

      if (projectsData.length > 0) {
        // Fetch findings for ALL projects (we'll filter in the memo above)
        const findingResults = await Promise.all(
          projectsData.map(p =>
            fetch(`${API_BASE}/findings?project_id=${p.id}`, { headers: authHeaders() })
              .then(r => r.ok ? r.json() : [])
          )
        );
        const flat: Finding[] = findingResults.flat();

        const severityOrder: Record<string, number> = {
          critical: 0, high: 1, medium: 2, low: 3, informational: 4,
        };
        flat.sort(
          (a, b) =>
            (severityOrder[a.severity?.toLowerCase()] ?? 5) -
            (severityOrder[b.severity?.toLowerCase()] ?? 5)
        );
        setAllFindings(flat);

        // Assignee map
        const assigneeResults = await Promise.all(
          projectsData.map(p =>
            fetch(`${API_BASE}/projects/${p.id}/assignments`, { headers: authHeaders() })
              .then(r => r.ok ? r.json() : [])
              .then((rows: Assignee[]) => ({ projectId: p.id, rows }))
          )
        );
        const map: Record<string, Assignee[]> = {};
        assigneeResults.forEach(({ projectId, rows }) => { map[projectId] = rows; });
        setAssigneeMap(map);

        // POCs
        if (flat.length > 0) {
          const pocResults = await Promise.all(
            flat.map(f =>
              fetch(`${API_BASE}/findings/${f.id}/pocs`, { headers: authHeaders() })
                .then(r => r.ok ? r.json() : [])
                .then((rows: FindingPoc[]) => ({ findingId: f.id, rows }))
            )
          );
          const pocMap: Record<string, FindingPoc[]> = {};
          pocResults.forEach(({ findingId, rows }) => { pocMap[findingId] = rows; });
          setPocs(pocMap);
        }
      }
    } catch (error) {
      console.error('Error fetching findings data:', error);
      toast.error('Failed to load findings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const getUsername = (uid: string | null | undefined) => {
    if (uid == null || uid === '') return '—';
    const key = String(uid);
    if (userNameById[key]) return userNameById[key];
    for (const assignees of Object.values(assigneeMap)) {
      const match = assignees.find(a => String(a.user_id) === key);
      if (match?.username) return match.username;
    }
    return key;
  };

  const canModifyFindingContent = (f: Finding) =>
    !!userId && (isAdminOrManager || String(f.created_by) === String(userId));

  const isAssigneeForProject = (projectId: string) =>
    (assigneeMap[projectId] ?? []).some(a => String(a.user_id) === String(userId));

  const canUpdateRetestForFinding = (f: Finding) =>
    isAdminOrManager || String(f.created_by) === String(userId) || isAssigneeForProject(f.project_id);

  const getProjectName = (projectId: string) =>
    allProjects.find(p => p.id === projectId)?.name ?? 'Unknown Project';

  const resetForm = () => {
    setFindingFormErrors({});
    setFormData({
      projectId: '', severity: '', title: '', description: '',
      stepsToReproduce: '', impact: '', remediation: '',
      affectedComponent: '', cvssScore: '', cweId: '',
    });
    setPendingPocs([]);
  };

  const normalizeSeverity = (s: string): Severity => {
    const map: Record<string, Severity> = {
      critical: 'Critical', high: 'High', medium: 'Medium',
      low: 'Low', informational: 'Informational', info: 'Informational',
    };
    return map[s?.toLowerCase()] ?? 'Informational';
  };

  const getSeverityBadge = (severity: string) => {
    const normalized = normalizeSeverity(severity);
    const { bg, text, border } = SEVERITY_STAT_CARD_STYLES[normalized];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}>
        {normalized}
      </span>
    );
  };

  const getSeverityIcon = (severity: string) => (
    <SeverityStatCardIcon severity={normalizeSeverity(severity)} />
  );

  const getRetestBadge = (status: string | null) => {
    if (!status) return null;
    const variants: Record<string, string> = {
      Open:        'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
      Fixed:       'bg-primary/10 text-primary border-primary/30',
      'Not Fixed': 'bg-primary/8 text-primary border-primary/25',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${variants[status]}`}>
        <RefreshCw className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  // ─── Add Finding ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateFindingForm(formData);
    setFindingFormErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    if (!user) { toast.error('You must be logged in'); return; }

    // Guard: tester can only submit to their assigned projects
    if (!isAdminOrManager) {
      const allowed = visibleProjects.some(p => p.id === formData.projectId);
      if (!allowed) {
        toast.error('You can only add findings to your assigned projects');
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/findings`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          project_id:         formData.projectId,
          title:              formData.title.trim(),
          description:        formData.description.trim(),
          severity:           formData.severity,
          steps_to_reproduce: formData.stepsToReproduce.trim() || null,
          impact:             formData.impact.trim() || null,
          remediation:        formData.remediation.trim() || null,
          affected_component: formData.affectedComponent.trim() || null,
          cvss_score:         formData.cvssScore.trim() ? parseFloat(formData.cvssScore.trim()) : null,
          cwe_id:             formData.cweId.trim() || null,
          created_by:         userId,
        }),
      });

      if (!res.ok) {
        let errMsg = res.statusText;
        try { const err = await res.clone().json(); errMsg = err.message ?? errMsg; } catch (_) {}
        toast.error(`Failed to add finding (${res.status}): ${errMsg}`);
        return;
      }

      const newFinding: Finding = await res.json();
      const uploadedPocs: FindingPoc[] = [];

      if (pendingPocs.length > 0) {
        for (const { file } of pendingPocs) {
          const formPayload = new FormData();
          formPayload.append('file', file);
          formPayload.append('uploaded_by', userId);
          try {
            const pocRes = await fetch(`${API_BASE}/findings/${newFinding.id}/pocs`, {
              method: 'POST',
              headers: authHeadersNoContent(),
              body: formPayload,
            });
            if (pocRes.ok) {
              const poc: FindingPoc = await pocRes.json();
              uploadedPocs.push(poc);
            }
          } catch (_) {}
        }
      }

      setAllFindings(prev => [newFinding, ...prev]);
      setPocs(prev => ({ ...prev, [newFinding.id]: uploadedPocs }));
      toast.success(`Finding added${uploadedPocs.length > 0 ? ` with ${uploadedPocs.length} POC(s)` : ''}!`);
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error adding finding:', error);
      toast.error('Failed to add finding');
    }
  };

  // ─── Stage POC files in the Add Finding form ──────────────────────────────────

  const MAX_POC_BYTES = 10 * 1024 * 1024;

  const handleFormPocSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    const validType = files.filter(f => allowed.includes(f.type));
    if (validType.length !== files.length) toast.error('Only JPEG and PNG files are allowed');
    const validSize = validType.filter(f => f.size <= MAX_POC_BYTES);
    if (validSize.length !== validType.length) {
      toast.error(`Each POC image must be ${MAX_POC_BYTES / (1024 * 1024)}MB or smaller`);
    }
    const newPocs = await Promise.all(
      validSize.map(async file => ({ file, preview: await fileToDataUrl(file) }))
    );
    setPendingPocs(prev => [...prev, ...newPocs]);
    if (formPocInputRef.current) formPocInputRef.current.value = '';
  };

  const removePendingPoc = (index: number) => {
    setPendingPocs(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Delete Finding ───────────────────────────────────────────────────────────

  const openEditFinding = (f: Finding, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canModifyFindingContent(f)) {
      toast.error('You can only edit findings you reported');
      return;
    }
    setEditingFindingId(f.id);
    setEditFormData({
      projectId: f.project_id,
      severity: normalizeSeverity(f.severity),
      title: f.title,
      description: f.description ?? '',
      stepsToReproduce: f.steps_to_reproduce ?? '',
      impact: f.impact ?? '',
      remediation: f.remediation ?? '',
      affectedComponent: f.affected_component ?? '',
      cvssScore: f.cvss_score != null ? String(f.cvss_score) : '',
      cweId: f.cwe_id ?? '',
    });
    setEditFormErrors({});
    setEditOpen(true);
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    if (!open) {
      setEditOpen(false);
      setEditFormData(null);
      setEditingFindingId(null);
      setEditFormErrors({});
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData || !editingFindingId) return;
    const validation = validateFindingForm(editFormData);
    setEditFormErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/findings/${editingFindingId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          title: editFormData.title.trim(),
          description: editFormData.description.trim(),
          severity: editFormData.severity,
          steps_to_reproduce: editFormData.stepsToReproduce.trim() || null,
          impact: editFormData.impact.trim() || null,
          remediation: editFormData.remediation.trim() || null,
          affected_component: editFormData.affectedComponent.trim() || null,
          cvss_score: editFormData.cvssScore.trim() ? parseFloat(editFormData.cvssScore.trim()) : null,
          cwe_id: editFormData.cweId.trim() || null,
        }),
      });
      if (!res.ok) {
        let errMsg = res.statusText;
        try {
          const err = await res.clone().json();
          errMsg = err.message ?? errMsg;
        } catch {
          /* ignore */
        }
        toast.error(`Failed to update finding (${res.status}): ${errMsg}`);
        return;
      }
      const updated: Finding = await res.json();
      setAllFindings(prev => prev.map(f => f.id === editingFindingId ? updated : f));
      toast.success('Finding updated');
      handleEditDialogOpenChange(false);
    } catch (error) {
      console.error('Error updating finding:', error);
      toast.error('Failed to update finding');
    }
  };

  const handleDelete = (findingId: string) => {
    const finding = findings.find(f => f.id === findingId);
    if (!finding || !userId) {
      toast.error('Finding not found');
      return;
    }
    if (!canModifyFindingContent(finding)) {
      toast.error('You can only delete findings you reported');
      return;
    }
    setDeletingFindingId(findingId);
  };

  const confirmDelete = async () => {
    if (!deletingFindingId) return;
    try {
      const res = await fetch(`${API_BASE}/findings/${deletingFindingId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error('Failed to delete: ' + (err.message ?? res.statusText));
        return;
      }
      setAllFindings(prev => prev.filter(f => f.id !== deletingFindingId));
      toast.success('Finding deleted');
    } catch (error) {
      console.error('Error deleting finding:', error);
      toast.error('Failed to delete finding');
    } finally {
      setDeletingFindingId(null);
    }
  };

  // ─── Upload POC ───────────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, findingId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const targetFinding = findings.find(x => x.id === findingId);
    if (!targetFinding || !canModifyFindingContent(targetFinding)) {
      toast.error('Only the author can upload POCs for this finding');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadingFindingId(null);
      return;
    }

    const file = files[0];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, JPG, and PNG files are allowed');
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append('file', file);
      formPayload.append('uploaded_by', userId);

      const res = await fetch(`${API_BASE}/findings/${findingId}/pocs`, {
        method: 'POST',
        headers: authHeadersNoContent(),
        body: formPayload,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error('Upload failed: ' + (err.message ?? res.statusText));
        return;
      }

      const newPoc: FindingPoc = await res.json();
      setPocs(prev => ({
        ...prev,
        [findingId]: [...(prev[findingId] || []), newPoc],
      }));
      toast.success('POC uploaded successfully!');
    } catch (error) {
      console.error('Error uploading POC:', error);
      toast.error('Failed to upload POC');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadingFindingId(null);
    }
  };

  // ─── Delete POC ───────────────────────────────────────────────────────────────

  const handleDeletePoc = async (poc: FindingPoc) => {
    if (!userId) return;
    if (String(poc.uploaded_by) !== String(userId) && !isAdminOrManager) {
      toast.error('You can only delete your own POCs');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/findings/${poc.finding_id}/pocs/${poc.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error('Failed to delete POC: ' + (err.message ?? res.statusText));
        return;
      }
      setPocs(prev => ({
        ...prev,
        [poc.finding_id]: prev[poc.finding_id]?.filter(p => p.id !== poc.id) || [],
      }));
      toast.success('POC deleted');
    } catch (error) {
      console.error('Error deleting POC:', error);
      toast.error('Failed to delete POC');
    }
  };

  // ─── Update Retest Status ─────────────────────────────────────────────────────

  const handleUpdateRetestStatus = async (findingId: string, status: RetestStatus) => {
    if (!user) { toast.error('You must be logged in'); return; }
    try {
      const res = await fetch(`${API_BASE}/findings/${findingId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          retest_status: status,
          retest_date:   new Date().toISOString(),
          retested_by:   userId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error('Failed to update retest status: ' + (err.message ?? res.statusText));
        return;
      }
      const updated: Finding = await res.json();
      setAllFindings(prev => prev.map(f => f.id === findingId ? updated : f));
      toast.success(`Retest status updated to "${status}"`);
    } catch (error) {
      console.error('Error updating retest status:', error);
      toast.error('Failed to update retest status');
    }
  };

  // ─── Filtered list ────────────────────────────────────────────────────────────

  const filteredFindings = findings.filter(finding => {
    const matchesSearch =
      finding.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (finding.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesSeverity = severityFilter === 'all' || normalizeSeverity(finding.severity) === severityFilter;
    const matchesProject  = projectFilter === 'all' || finding.project_id === projectFilter;
    return matchesSearch && matchesSeverity && matchesProject;
  });

  // ─── Render guards ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <DashboardLayout title="Findings" description="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Findings" description="View and manage all vulnerability findings">
      <div className="space-y-6">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search findings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-secondary/50">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Informational">Informational</SelectItem>
            </SelectContent>
          </Select>

          {/* Project filter shows only visible projects */}
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-secondary/50">
              <SelectValue placeholder="Filter by Project" />
            </SelectTrigger>
            <SelectContent className="max-w-[calc(100vw-2rem)] w-full">
              <SelectItem value="all">All Projects</SelectItem>
              {visibleProjects.map(p => (
                <SelectItem key={p.id} value={p.id} className="truncate max-w-full">
                  <span className="truncate block max-w-[calc(100vw-4rem)]">{p.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={handleAddFindingDialogOpenChange}>
            <DialogTrigger asChild>
              <Button variant="default" className="gradient-technieum shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Finding
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Finding</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project *</Label>
                    {/* formProjects = visibleProjects, so testers only see their assigned projects */}
                    <Select
                      value={formData.projectId}
                      onValueChange={(v) => {
                        clearFindingFieldError('projectId');
                        setFormData({ ...formData, projectId: v });
                      }}
                    >
                      <SelectTrigger className={cn(findingFormErrors.projectId && 'border-destructive')}>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {formProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {findingFormErrors.projectId ? (
                      <p className="text-xs text-destructive">{findingFormErrors.projectId}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Severity *</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(v) => {
                        clearFindingFieldError('severity');
                        setFormData({ ...formData, severity: v as Severity });
                      }}
                    >
                      <SelectTrigger className={cn(findingFormErrors.severity && 'border-destructive')}>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Critical">Critical</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Informational">Informational</SelectItem>
                      </SelectContent>
                    </Select>
                    {findingFormErrors.severity ? (
                      <p className="text-xs text-destructive">{findingFormErrors.severity}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      placeholder="Finding title"
                      value={formData.title}
                      onChange={(e) => {
                        clearFindingFieldError('title');
                        setFormData({ ...formData, title: e.target.value });
                      }}
                      className={cn(findingFormErrors.title && 'border-destructive')}
                    />
                    {findingFormErrors.title ? (
                      <p className="text-xs text-destructive">{findingFormErrors.title}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">3–300 characters, no control characters</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      CVSS Score <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                    </Label>
                    <Input
                      placeholder="e.g., 9.8"
                      type="text"
                      inputMode="decimal"
                      value={formData.cvssScore}
                      onChange={(e) => {
                        clearFindingFieldError('cvssScore');
                        setFormData({ ...formData, cvssScore: e.target.value });
                      }}
                      className={cn(findingFormErrors.cvssScore && 'border-destructive')}
                    />
                    {findingFormErrors.cvssScore ? (
                      <p className="text-xs text-destructive">{findingFormErrors.cvssScore}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">0–10 if provided</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Affected Component <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                    </Label>
                    <Input
                      placeholder="e.g., /api/users"
                      value={formData.affectedComponent}
                      onChange={(e) => {
                        clearFindingFieldError('affectedComponent');
                        setFormData({ ...formData, affectedComponent: e.target.value });
                      }}
                      className={cn(findingFormErrors.affectedComponent && 'border-destructive')}
                    />
                    {findingFormErrors.affectedComponent ? (
                      <p className="text-xs text-destructive">{findingFormErrors.affectedComponent}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      CWE ID <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                    </Label>
                    <Input
                      placeholder="e.g., CWE-79"
                      value={formData.cweId}
                      onChange={(e) => {
                        clearFindingFieldError('cweId');
                        setFormData({ ...formData, cweId: e.target.value });
                      }}
                      className={cn(findingFormErrors.cweId && 'border-destructive')}
                    />
                    {findingFormErrors.cweId ? (
                      <p className="text-xs text-destructive">{findingFormErrors.cweId}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Format: CWE-###</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    placeholder="Detailed description of the vulnerability"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => {
                      clearFindingFieldError('description');
                      setFormData({ ...formData, description: e.target.value });
                    }}
                    className={cn(findingFormErrors.description && 'border-destructive')}
                  />
                  {findingFormErrors.description ? (
                    <p className="text-xs text-destructive">{findingFormErrors.description}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">10–20,000 characters</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>
                    Steps to Reproduce <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Textarea
                    placeholder="Step-by-step instructions to reproduce"
                    rows={4}
                    value={formData.stepsToReproduce}
                    onChange={(e) => {
                      clearFindingFieldError('stepsToReproduce');
                      setFormData({ ...formData, stepsToReproduce: e.target.value });
                    }}
                    className={cn(findingFormErrors.stepsToReproduce && 'border-destructive')}
                  />
                  {findingFormErrors.stepsToReproduce ? (
                    <p className="text-xs text-destructive">{findingFormErrors.stepsToReproduce}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>
                    Impact <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Textarea
                    placeholder="Potential impact of this vulnerability"
                    rows={2}
                    value={formData.impact}
                    onChange={(e) => {
                      clearFindingFieldError('impact');
                      setFormData({ ...formData, impact: e.target.value });
                    }}
                    className={cn(findingFormErrors.impact && 'border-destructive')}
                  />
                  {findingFormErrors.impact ? (
                    <p className="text-xs text-destructive">{findingFormErrors.impact}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>
                    Remediation <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Textarea
                    placeholder="Recommended remediation steps"
                    rows={3}
                    value={formData.remediation}
                    onChange={(e) => {
                      clearFindingFieldError('remediation');
                      setFormData({ ...formData, remediation: e.target.value });
                    }}
                    className={cn(findingFormErrors.remediation && 'border-destructive')}
                  />
                  {findingFormErrors.remediation ? (
                    <p className="text-xs text-destructive">{findingFormErrors.remediation}</p>
                  ) : null}
                </div>

                {/* POC Upload in form — optional */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>
                      Proof of Concept (POC) <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                    </Label>
                    <input ref={formPocInputRef} type="file" accept=".jpg,.jpeg,.png" multiple className="hidden" onChange={handleFormPocSelect} />
                  </div>
                  {pendingPocs.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {pendingPocs.map((poc, idx) => (
                        <div key={idx} className="relative group">
                          <img src={poc.preview} alt={poc.file.name} className="rounded-lg border border-border/50 w-full h-24 object-cover" />
                          <button type="button" onClick={() => removePendingPoc(idx)}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                            <X className="h-3 w-3" />
                          </button>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{poc.file.name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => formPocInputRef.current?.click()}>
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload POC screenshots</p>
                      <p className="text-xs text-muted-foreground mt-1">JPEG, PNG up to 10MB</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                  </DialogClose>
                  <Button type="submit" className="gradient-technieum">Submit Finding</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats — scoped to visible findings */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(['Critical', 'High', 'Medium', 'Low', 'Informational'] as Severity[]).map(severity => {
            const count = findings.filter(f => normalizeSeverity(f.severity) === severity).length;
            const { bg, text, border } = SEVERITY_STAT_CARD_STYLES[severity];
            return (
              <Card key={severity} className={`p-4 border ${border} ${bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${text}`}>{count}</p>
                    <p className="text-xs text-muted-foreground">{severity}</p>
                  </div>
                  {getSeverityIcon(severity)}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Findings List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredFindings.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No findings found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {findings.length === 0 && !isAdminOrManager
                  ? 'You have no findings in your assigned projects yet.'
                  : 'Click the "Add Finding" button to create your first finding'}
              </p>
            </Card>
          ) : (
            filteredFindings.map((finding, index) => {
              const isExpanded  = expandedFinding === finding.id;
              const canEditOrDelete = canModifyFindingContent(finding);
              const findingPocs = pocs[finding.id] || [];

              return (
                <Card key={finding.id} className="animate-fade-in overflow-hidden" style={{ animationDelay: `${index * 30}ms` }}>
                  <div className="cursor-pointer p-4 sm:px-5 sm:py-5" onClick={() => setExpandedFinding(isExpanded ? null : finding.id)}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 sm:gap-3">
                          {getSeverityBadge(finding.severity)}
                          {finding.cvss_score && (
                            <span className="inline-flex items-center text-sm font-mono leading-none text-muted-foreground">
                              CVSS {finding.cvss_score}
                            </span>
                          )}
                          <Badge variant="secondary" className="hidden max-w-[min(100%,11rem)] truncate text-xs sm:inline-flex">
                            {getProjectName(finding.project_id)}
                          </Badge>
                          <Badge variant="secondary" className="inline-flex max-w-[min(100%,11rem)] truncate text-xs sm:hidden">
                            <span className="truncate">{getProjectName(finding.project_id)}</span>
                          </Badge>
                          {findingPocs.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              {findingPocs.length} POC{findingPocs.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold leading-snug">{finding.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{finding.description}</p>
                      </div>
                      <div className="flex w-full min-w-0 shrink-0 items-center justify-between gap-3 border-t border-border/40 pt-3 sm:w-auto sm:flex-col sm:items-end sm:justify-start sm:gap-3 sm:border-t-0 sm:pt-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <Badge
                            variant={finding.status === 'Open' ? 'destructive' : 'secondary'}
                            className="shrink-0 whitespace-nowrap capitalize"
                          >
                            {finding.status}
                          </Badge>
                          {finding.retest_status && (
                            <span className="inline-flex shrink-0 items-center">{getRetestBadge(finding.retest_status)}</span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                          {canEditOrDelete && (
                            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title="Edit finding" onClick={(e) => openEditFinding(finding, e)}>
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                          {canEditOrDelete && (
                            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title="Delete finding" onClick={(e) => { e.stopPropagation(); handleDelete(finding.id); }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground" aria-hidden>
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-4 animate-fade-in">
                      {finding.steps_to_reproduce && (
                        <div>
                          <h4 className="text-sm font-semibold text-primary mb-2">Steps to Reproduce</h4>
                          <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-secondary/30 p-3 rounded-lg">{finding.steps_to_reproduce}</pre>
                        </div>
                      )}
                      {finding.impact && (
                        <div>
                          <h4 className="text-sm font-semibold text-primary mb-2">Impact</h4>
                          <p className="text-sm text-muted-foreground">{finding.impact}</p>
                        </div>
                      )}
                      {finding.remediation && (
                        <div>
                          <h4 className="text-sm font-semibold text-primary mb-2">Remediation</h4>
                          <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-secondary/30 p-3 rounded-lg">{finding.remediation}</pre>
                        </div>
                      )}
                      {finding.affected_component && (
                        <div>
                          <h4 className="text-sm font-semibold text-primary mb-2">Affected Component</h4>
                          <Badge variant="secondary" className="font-mono text-xs">{finding.affected_component}</Badge>
                        </div>
                      )}
                      {finding.cwe_id && (
                        <div>
                          <h4 className="text-sm font-semibold text-primary mb-2">CWE</h4>
                          <Badge variant="outline" className="font-mono text-xs">{finding.cwe_id}</Badge>
                        </div>
                      )}

                      {/* POC Images */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-primary">Proof of Concept (POC)</h4>
                          <div>
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept=".jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(e, uploadingFindingId || finding.id)}
                            />
                            {canModifyFindingContent(finding) && (
                              <Button variant="outline" size="sm" onClick={(e) => {
                                e.stopPropagation();
                                setUploadingFindingId(finding.id);
                                fileInputRef.current?.click();
                              }}>
                                <Upload className="h-4 w-4 mr-1" />
                                Upload POC
                              </Button>
                            )}
                          </div>
                        </div>
                        {findingPocs.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {findingPocs.map(poc => (
                              <div key={poc.id} className="relative group">
                                <img
                                  src={poc.file_path}
                                  alt={poc.file_name}
                                  className="rounded-lg border border-border/50 w-full h-32 object-cover cursor-pointer hover:opacity-80"
                                  onClick={(e) => { e.stopPropagation(); window.open(poc.file_path, '_blank'); }}
                                />
                                {!!userId && (String(poc.uploaded_by) === String(userId) || isAdminOrManager) && (
                                  <button
                                    type="button"
                                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                                    onClick={(e) => { e.stopPropagation(); handleDeletePoc(poc); }}
                                    title="Delete POC"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                                <p className="text-xs text-muted-foreground mt-1 truncate">{poc.file_name}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No POC images uploaded yet.</p>
                        )}
                      </div>

                      {/* Retest Status */}
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-primary mb-1">Retest Status</h4>
                            <div className="flex items-center gap-2">
                              {finding.retest_status ? (
                                <>
                                  {getRetestBadge(finding.retest_status)}
                                  {(finding.retested_by || finding.retest_date) && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {finding.retested_by && finding.retest_date ? (
                                        <>
                                          Lastly updated by:{' '}
                                          <span className="font-medium text-foreground/85">
                                            {getUsername(finding.retested_by)}
                                          </span>{' '}
                                          on {new Date(finding.retest_date).toLocaleDateString()}
                                        </>
                                      ) : finding.retested_by ? (
                                        <>
                                          Lastly updated by:{' '}
                                          <span className="font-medium text-foreground/85">
                                            {getUsername(finding.retested_by)}
                                          </span>
                                        </>
                                      ) : finding.retest_date ? (
                                        <>
                                          Lastly updated: {new Date(finding.retest_date).toLocaleDateString()}
                                        </>
                                      ) : null}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">Not retested yet</span>
                              )}
                            </div>
                          </div>
                          {canUpdateRetestForFinding(finding) ? (
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <Select value={finding.retest_status || ''} onValueChange={(v) => handleUpdateRetestStatus(finding.id, v as RetestStatus)}>
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue placeholder="Update status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Open">Open</SelectItem>
                                  <SelectItem value="Fixed">Fixed</SelectItem>
                                  <SelectItem value="Not Fixed">Not Fixed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground pt-2 border-t border-border/50">
                        <span>Added by: {getUsername(finding.created_by)}</span>
                        <span>Created: {new Date(finding.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Finding */}
      <Dialog open={editOpen} onOpenChange={handleEditDialogOpenChange}>
        {editFormData && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Finding</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Input value={getProjectName(editFormData.projectId)} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label>Severity *</Label>
                  <Select
                    value={editFormData.severity}
                    onValueChange={(v) => {
                      clearEditFieldError('severity');
                      setEditFormData({ ...editFormData, severity: v as Severity });
                    }}
                  >
                    <SelectTrigger className={cn(editFormErrors.severity && 'border-destructive')}>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Informational">Informational</SelectItem>
                    </SelectContent>
                  </Select>
                  {editFormErrors.severity ? (
                    <p className="text-xs text-destructive">{editFormErrors.severity}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    placeholder="Finding title"
                    value={editFormData.title}
                    onChange={(e) => {
                      clearEditFieldError('title');
                      setEditFormData({ ...editFormData, title: e.target.value });
                    }}
                    className={cn(editFormErrors.title && 'border-destructive')}
                  />
                  {editFormErrors.title ? (
                    <p className="text-xs text-destructive">{editFormErrors.title}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">3–300 characters, no control characters</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>
                    CVSS Score <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g., 9.8"
                    type="text"
                    inputMode="decimal"
                    value={editFormData.cvssScore}
                    onChange={(e) => {
                      clearEditFieldError('cvssScore');
                      setEditFormData({ ...editFormData, cvssScore: e.target.value });
                    }}
                    className={cn(editFormErrors.cvssScore && 'border-destructive')}
                  />
                  {editFormErrors.cvssScore ? (
                    <p className="text-xs text-destructive">{editFormErrors.cvssScore}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">0–10 if provided</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Affected Component <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g., /api/users"
                    value={editFormData.affectedComponent}
                    onChange={(e) => {
                      clearEditFieldError('affectedComponent');
                      setEditFormData({ ...editFormData, affectedComponent: e.target.value });
                    }}
                    className={cn(editFormErrors.affectedComponent && 'border-destructive')}
                  />
                  {editFormErrors.affectedComponent ? (
                    <p className="text-xs text-destructive">{editFormErrors.affectedComponent}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>
                    CWE ID <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g., CWE-79"
                    value={editFormData.cweId}
                    onChange={(e) => {
                      clearEditFieldError('cweId');
                      setEditFormData({ ...editFormData, cweId: e.target.value });
                    }}
                    className={cn(editFormErrors.cweId && 'border-destructive')}
                  />
                  {editFormErrors.cweId ? (
                    <p className="text-xs text-destructive">{editFormErrors.cweId}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Format: CWE-###</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Detailed description of the vulnerability"
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => {
                    clearEditFieldError('description');
                    setEditFormData({ ...editFormData, description: e.target.value });
                  }}
                  className={cn(editFormErrors.description && 'border-destructive')}
                />
                {editFormErrors.description ? (
                  <p className="text-xs text-destructive">{editFormErrors.description}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">10–20,000 characters</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  Steps to Reproduce <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Textarea
                  placeholder="Step-by-step instructions to reproduce"
                  rows={4}
                  value={editFormData.stepsToReproduce}
                  onChange={(e) => {
                    clearEditFieldError('stepsToReproduce');
                    setEditFormData({ ...editFormData, stepsToReproduce: e.target.value });
                  }}
                  className={cn(editFormErrors.stepsToReproduce && 'border-destructive')}
                />
                {editFormErrors.stepsToReproduce ? (
                  <p className="text-xs text-destructive">{editFormErrors.stepsToReproduce}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>
                  Impact <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Textarea
                  placeholder="Potential impact of this vulnerability"
                  rows={2}
                  value={editFormData.impact}
                  onChange={(e) => {
                    clearEditFieldError('impact');
                    setEditFormData({ ...editFormData, impact: e.target.value });
                  }}
                  className={cn(editFormErrors.impact && 'border-destructive')}
                />
                {editFormErrors.impact ? (
                  <p className="text-xs text-destructive">{editFormErrors.impact}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>
                  Remediation <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Textarea
                  placeholder="Recommended remediation steps"
                  rows={3}
                  value={editFormData.remediation}
                  onChange={(e) => {
                    clearEditFieldError('remediation');
                    setEditFormData({ ...editFormData, remediation: e.target.value });
                  }}
                  className={cn(editFormErrors.remediation && 'border-destructive')}
                />
                {editFormErrors.remediation ? (
                  <p className="text-xs text-destructive">{editFormErrors.remediation}</p>
                ) : null}
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => handleEditDialogOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-technieum">Save changes</Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingFindingId} onOpenChange={(open) => !open && setDeletingFindingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Finding
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this finding? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setDeletingFindingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}