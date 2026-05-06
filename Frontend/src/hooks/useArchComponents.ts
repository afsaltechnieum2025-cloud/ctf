import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArchComponent } from '@/utils/projectTypes';
import { API as API_BASE } from '@/utils/api';
import { authHeaders } from '@/hooks/useProjectData';

type Status = 'idle' | 'loading' | 'saving' | 'error';

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { message?: string; error?: string };
    return j.message || j.error || text.slice(0, 200) || `HTTP ${res.status}`;
  } catch {
    return text.slice(0, 200) || `HTTP ${res.status}`;
  }
}

export function useArchComponents(projectId: string) {
  const [components, setComponents] = useState<ArchComponent[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const pendingDelete = useRef<Set<string>>(new Set());

  const fetchComponents = useCallback(async () => {
    if (!projectId || projectId === 'undefined') return;
    setStatus('loading');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/arch`, { headers: authHeaders() });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      const json = (await res.json()) as { success?: boolean; message?: string; data?: ArchComponent[] };
      if (!json.success) throw new Error(json.message ?? 'Failed to load components');
      setComponents(Array.isArray(json.data) ? json.data : []);
      setStatus('idle');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load components';
      setError(msg);
      setStatus('error');
    }
  }, [projectId]);

  useEffect(() => { void fetchComponents(); }, [fetchComponents]);

  const bulkSave = useCallback(async (comps: ArchComponent[]) => {
    if (!projectId || projectId === 'undefined') {
      setError('Project ID is missing ù cannot save components.');
      return;
    }
    setStatus('saving');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/arch/bulk`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ components: comps }),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      const json = (await res.json()) as { success?: boolean; message?: string };
      if (!json.success) throw new Error(json.message ?? 'Bulk save failed');
      setComponents(comps);
      setStatus('idle');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save components';
      setError(msg);
      setStatus('error');
    }
  }, [projectId]);

  const addComponent = useCallback(async (comp: Omit<ArchComponent, 'id'>) => {
    setStatus('saving');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/arch`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(comp),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      const json = (await res.json()) as { success?: boolean; message?: string; data?: ArchComponent };
      if (!json.success || !json.data) throw new Error(json.message ?? 'Failed to add component');
      setComponents(prev => [...prev, json.data as ArchComponent]);
      setStatus('idle');
      return json.data;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add component';
      setError(msg);
      setStatus('error');
    }
  }, [projectId]);

  const updateComponent = useCallback(async (id: string, patch: Partial<ArchComponent>) => {
    setComponents(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/arch/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      const json = (await res.json()) as { success?: boolean; message?: string };
      if (!json.success) throw new Error(json.message ?? 'Update failed');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update component';
      setError(msg);
      await fetchComponents();
    }
  }, [projectId, fetchComponents]);

  const deleteComponent = useCallback(async (id: string) => {
    if (pendingDelete.current.has(id)) return;
    pendingDelete.current.add(id);
    setComponents(prev => prev.filter(c => c.id !== id));
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/arch/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      const json = (await res.json()) as { success?: boolean; message?: string };
      if (!json.success) throw new Error(json.message ?? 'Delete failed');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete component';
      setError(msg);
      await fetchComponents();
    } finally {
      pendingDelete.current.delete(id);
    }
  }, [projectId, fetchComponents]);

  return {
    components,
    setComponents,
    status,
    error,
    setError,
    fetchComponents,
    bulkSave,
    addComponent,
    updateComponent,
    deleteComponent,
  };
}
