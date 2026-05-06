import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Project, Finding, FindingPoc, Assignee, ChecklistRow, CLType } from '@/utils/projectTypes';
import { API as API_BASE, STATIC_BASE } from '@/utils/api';
export { STATIC_BASE };


export const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

export const authHeadersNoContent = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function useProjectData(id: string | undefined, userId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [allUsers, setAllUsers] = useState<Record<string, string>>({});
  const [pocs, setPocs] = useState<Record<string, FindingPoc[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [clProgress, setClProgress] = useState<Record<string, Record<string, boolean>>>({
    web: {}, api: {}, cloud: {}, aiLlm: {},
  });
  const [clSaving, setClSaving] = useState<Record<string, boolean>>({});
  const [checklistDetails, setChecklistDetails] = useState<Record<string, { updated_by: string | null; updated_at: string | null }>>({});

  const getUsername = (uid: string | null | undefined): string => {
    if (!uid) return 'Unknown';
    const key = String(uid);
    if (allUsers[key]) return allUsers[key];
    const a = assignees.find(a => String(a.user_id) === key);
    if (a?.username) return a.username;
    return key;
  };

  const fetchChecklistProgress = async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/checklist`, { headers: authHeaders() });
      if (!res.ok) return;
      const rows: ChecklistRow[] = await res.json();
      const next: Record<string, Record<string, boolean>> = { web: {}, api: {}, cloud: {}, aiLlm: {} };
      const details: Record<string, { updated_by: string | null; updated_at: string | null }> = {};
      rows.forEach(r => {
        const type = r.checklist_type as CLType;
        if (!next[type]) next[type] = {};
        const key = r.item_key;
        next[type][key] = Boolean(r.is_checked);
        details[`${type}::${key}`] = { updated_by: r.updated_by, updated_at: r.updated_at };
      });
      setClProgress(next);
      setChecklistDetails(details);
    } catch (e) {
      console.warn('fetchChecklistProgress failed:', e);
    }
  };

  const fetchProjectData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const pr = await fetch(`${API_BASE}/projects/${id}`, { headers: authHeaders() });
      if (!pr.ok) throw new Error('Failed to fetch project');
      setProject(await pr.json());

      const fr = await fetch(`${API_BASE}/findings?project_id=${id}`, { headers: authHeaders() });
      let fetchedFindings: Finding[] = [];
      if (fr.ok) {
        const data: Finding[] = await fr.json();
        const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, informational: 4, info: 4 };
        data.sort((a, b) => (order[String(a.severity).toLowerCase()] ?? 5) - (order[String(b.severity).toLowerCase()] ?? 5));
        fetchedFindings = data;
        setFindings(data);
      }

      if (fetchedFindings.length > 0) {
        const pocResults = await Promise.all(
          fetchedFindings.map(f =>
            fetch(`${API_BASE}/findings/${f.id}/pocs`, { headers: authHeaders() })
              .then(r => r.ok ? r.json() : [])
              .then((rows: FindingPoc[]) => ({ findingId: f.id, rows }))
          )
        );
        const pocMap: Record<string, FindingPoc[]> = {};
        pocResults.forEach(({ findingId, rows }) => { pocMap[findingId] = rows; });
        setPocs(pocMap);
      }

      try {
        const ur = await fetch(`${API_BASE}/users`, { headers: authHeaders() });
        if (ur.ok) {
          const ud = await ur.json();
          const map: Record<string, string> = {};
          ud.forEach((u: any) => { map[String(u.id)] = u.username || u.name || u.email || String(u.id); });
          setAllUsers(map);
        }
      } catch (_) { }

      const ar = await fetch(`${API_BASE}/projects/${id}/assignments`, { headers: authHeaders() });
      if (ar.ok) setAssignees(await ar.json());

      await fetchChecklistProgress();
    } catch (err) {
      console.error(err);
      toast.error('Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProjectData(); }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!project) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); toast.error('Failed: ' + (e.message ?? res.statusText)); return; }
      setProject(prev => prev ? { ...prev, status: newStatus } : prev);
      toast.success(`Status updated to "${newStatus}"`);
    } catch { toast.error('Failed to update status'); }
    finally { setIsUpdatingStatus(false); }
  };

  const toggleItem = async (type: CLType, category: string, item: string) => {
    if (!id) return;
    const key = `${category}::${item}`;
    const newValue = !clProgress[type]?.[key];
    setClProgress(prev => ({ ...prev, [type]: { ...prev[type], [key]: newValue } }));
    setClSaving(prev => ({ ...prev, [`${type}::${key}`]: true }));
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/checklist`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ checklist_type: type, category, item_key: key, is_checked: newValue, updated_by: userId }),
      });
      if (!res.ok) {
        setClProgress(prev => ({ ...prev, [type]: { ...prev[type], [key]: !newValue } }));
        toast.error('Failed to save checklist item');
      } else {
        setChecklistDetails(prev => ({
          ...prev,
          [`${type}::${key}`]: { updated_by: userId, updated_at: new Date().toISOString() }
        }));
      }
    } catch {
      setClProgress(prev => ({ ...prev, [type]: { ...prev[type], [key]: !newValue } }));
      toast.error('Failed to save checklist item');
    } finally {
      setClSaving(prev => ({ ...prev, [`${type}::${key}`]: false }));
    }
  };

  const addFinding = (nf: Finding) => setFindings(prev => [nf, ...prev]);
  const addPocs = (findingId: string, newPocs: FindingPoc[]) =>
    setPocs(prev => ({ ...prev, [findingId]: [...(prev[findingId] || []), ...newPocs] }));
  const deleteFinding = (findingId: string) => setFindings(prev => prev.filter(f => f.id !== findingId));
  const addSinglePoc = (findingId: string, poc: FindingPoc) =>
    setPocs(prev => ({ ...prev, [findingId]: [...(prev[findingId] || []), poc] }));
  const removePoc = (findingId: string, pocId: string) =>
    setPocs(prev => ({ ...prev, [findingId]: prev[findingId]?.filter(p => p.id !== pocId) || [] }));
  const updateFinding = (updated: Finding) =>
    setFindings(prev => prev.map(f => f.id === updated.id ? updated : f));

  return {
    project, findings, assignees, allUsers, pocs, isLoading, isUpdatingStatus,
    clProgress, clSaving, checklistDetails,
    getUsername, fetchProjectData, fetchChecklistProgress,
    handleUpdateStatus, toggleItem,
    addFinding, addPocs, deleteFinding, addSinglePoc, removePoc, updateFinding,
    setProject,
  };
}