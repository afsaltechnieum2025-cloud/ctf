import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Upload, X, RefreshCw, Trash2, Pencil, Image as ImageIcon, Terminal, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getSeverityBadge,
  getRetestBadge,
  findingTypeConfig,
  normalizeSeverity,
} from '@/utils/severityHelpers';
import { authHeaders, authHeadersNoContent, STATIC_BASE } from '@/hooks/useProjectData';
import type { Finding, FindingPoc, FindingType, RetestStatus, Severity } from '@/utils/projectTypes';
import { API as API_BASE } from '@/utils/api';

// Re-export getRetestBadge from here for convenience — it's defined in severityHelpers
export { getRetestBadge };

// ─── POC URL helper ───────────────────────────────────────────────────────────
// Handles three cases for poc.file_path:
//   1. Complete data URL  → "data:image/png;base64,iVBORw..."  (backend returns this)
//      Use as-is. This is what Findings.tsx already does with src={poc.file_path}.
//   2. Relative disk path → "uploads/uuid.png"
//      Prepend STATIC_BASE to get the full URL.
//   3. Raw base64 string  → "iVBORw..." (no prefix, legacy DB records)
//      Wrap in a data: URL with the correct MIME type.
//
// IMPORTANT: data URLs contain "/" so we must check for "data:" FIRST before
// any path-detection logic, otherwise the data URL gets incorrectly treated as
// a file path and STATIC_BASE gets prepended to it.
const getPocSrc = (filePath: string): string => {
  if (!filePath) return '';

  // Case 1 — already a complete data URL, use directly
  if (filePath.startsWith('data:')) return filePath;

  // Strip any accidental leading slash so STATIC_BASE + path never double-slashes
  const clean = filePath.replace(/^\/+/, '');

  // Case 2 — looks like a disk path
  if (clean.startsWith('uploads/') || /\.(png|jpe?g|gif|webp)$/i.test(clean)) {
    return `${STATIC_BASE}${clean}`;
  }

  // Case 3 — raw base64, sniff MIME from magic bytes at the start of the string:
  //   PNG  → "iVBORw"   JPEG → "/9j/"   GIF → "R0lG"   WebP → "UklG"
  let mime = 'image/png'; // safe default
  if (clean.startsWith('/9j/')) mime = 'image/jpeg';
  if (clean.startsWith('R0lG')) mime = 'image/gif';
  if (clean.startsWith('UklG')) mime = 'image/webp';

  return `data:${mime};base64,${clean}`;
};

// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  finding: Finding;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  findingPocs: FindingPoc[];
  userId: string;
  projectName: string;
  getUsername: (uid: string | null | undefined) => string;
  onDelete: (findingId: string) => void;
  onAddPoc: (findingId: string, poc: FindingPoc) => void;
  onRemovePoc: (findingId: string, pocId: string) => void;
  onUpdateRetest: (findingId: string, status: RetestStatus) => void;
  isModerator?: boolean;
  canUpdateRetest?: boolean;
  onFindingUpdated?: (finding: Finding) => void;
};

export default function FindingCard({
  finding, index, isExpanded, onToggleExpand,
  findingPocs, userId, projectName,
  getUsername, onDelete, onAddPoc, onRemovePoc, onUpdateRetest,
  isModerator = false,
  canUpdateRetest = false,
  onFindingUpdated,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canEditOrDeleteFinding =
    !!userId && (String(finding.created_by) === String(userId) || isModerator);

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSeverity, setEditSeverity] = useState<Severity>('Medium');
  const [editSteps, setEditSteps] = useState('');
  const [editImpact, setEditImpact] = useState('');
  const [editRemediation, setEditRemediation] = useState('');
  const [editAffected, setEditAffected] = useState('');
  const [editCvss, setEditCvss] = useState('');
  const [editCwe, setEditCwe] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const openEditDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEditOrDeleteFinding) return;
    setEditTitle(finding.title);
    setEditDescription(finding.description ?? '');
    setEditSeverity(normalizeSeverity(finding.severity));
    setEditSteps(finding.steps_to_reproduce ?? '');
    setEditImpact(finding.impact ?? '');
    setEditRemediation(finding.remediation ?? '');
    setEditAffected(finding.affected_component ?? '');
    setEditCvss(finding.cvss_score != null ? String(finding.cvss_score) : '');
    setEditCwe(finding.cwe_id ?? '');
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(`${API_BASE}/findings/${finding.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          severity: editSeverity,
          steps_to_reproduce: editSteps.trim() || null,
          impact: editImpact.trim() || null,
          remediation: editRemediation.trim() || null,
          affected_component: editAffected.trim() || null,
          cvss_score: editCvss.trim() ? parseFloat(editCvss.trim()) : null,
          cwe_id: editCwe.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error('Failed to update: ' + (err.message ?? res.statusText));
        return;
      }
      const updated: Finding = await res.json();
      onFindingUpdated?.(updated);
      toast.success('Finding updated');
      setEditOpen(false);
    } catch {
      toast.error('Failed to update finding');
    } finally {
      setEditSaving(false);
    }
  };
  const findingType = (finding.finding_type || 'pentest') as FindingType;
  const typeConfig = findingTypeConfig[findingType];
  const LlmCategoryIcon = findingTypeConfig.llm.Icon;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    if (!canEditOrDeleteFinding) {
      toast.error('Only the author can upload POCs for this finding');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const file = files[0];
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) { toast.error('Only JPEG and PNG allowed'); return; }
    try {
      const p = new FormData(); p.append('file', file); p.append('uploaded_by', userId);
      const res = await fetch(`${API_BASE}/findings/${finding.id}/pocs`, { method: 'POST', headers: authHeadersNoContent(), body: p });
      if (!res.ok) { const e = await res.json(); toast.error('Upload failed: ' + (e.message ?? res.statusText)); return; }
      const np: FindingPoc = await res.json();
      onAddPoc(finding.id, np);
      toast.success('POC uploaded!');
    } catch { toast.error('Failed to upload POC'); }
    finally { if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDeletePoc = async (poc: FindingPoc) => {
    if (!userId) return;
    if (String(poc.uploaded_by) !== String(userId) && !isModerator) {
      toast.error('You can only delete your own POCs');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/findings/${poc.finding_id}/pocs/${poc.id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) { const e = await res.json(); toast.error('Failed: ' + (e.message ?? res.statusText)); return; }
      onRemovePoc(poc.finding_id, poc.id);
      toast.success('POC deleted');
    } catch { toast.error('Failed to delete POC'); }
  };

  return (
    <>
    <Card className="animate-fade-in overflow-hidden" style={{ animationDelay: `${index * 30}ms` }}>
      {/* ── Header row (always visible) ── */}
      <div className="cursor-pointer p-4 sm:px-5 sm:py-5" onClick={onToggleExpand}>
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
                {projectName}
              </Badge>
              <Badge variant="secondary" className="inline-flex max-w-[min(100%,11rem)] truncate text-xs sm:hidden">
                <span className="truncate">{projectName}</span>
              </Badge>
              {findingPocs.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <ImageIcon className="h-3 w-3 mr-1" />{findingPocs.length} POC{findingPocs.length > 1 ? 's' : ''}
                </Badge>
              )}
              {finding.finding_type === 'sast' && finding.file_path && (
                <Badge variant="outline" className={`text-xs ${findingTypeConfig.sast.bgColor} ${findingTypeConfig.sast.color} ${findingTypeConfig.sast.borderColor}`}>
                  <Terminal className="h-3 w-3 mr-1" />{finding.file_path.split('/').pop()}
                </Badge>
              )}
              {finding.finding_type === 'asm' && finding.asset_type && (
                <Badge variant="outline" className={`text-xs ${findingTypeConfig.asm.bgColor} ${findingTypeConfig.asm.color} ${findingTypeConfig.asm.borderColor}`}>
                  <Zap className="h-3 w-3 mr-1" />{finding.asset_type}{finding.port ? `:${finding.port}` : ''}
                </Badge>
              )}
              {finding.finding_type === 'llm' && finding.llm_category && (
                <Badge variant="outline" className={`text-xs ${findingTypeConfig.llm.bgColor} ${findingTypeConfig.llm.color} ${findingTypeConfig.llm.borderColor}`}>
                  <LlmCategoryIcon className="h-3 w-3 mr-1" />{finding.llm_category}
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
              {canEditOrDeleteFinding && (
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title="Edit finding" onClick={openEditDialog}>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
              {canEditOrDeleteFinding && (
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title="Delete finding" onClick={(e) => { e.stopPropagation(); onDelete(finding.id); }}>
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

      {/* ── Expanded details ── */}
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

          {/* SAST details */}
          {finding.finding_type === 'sast' && (
            <>
              {finding.file_path && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">File Location</h4>
                  <code className="text-xs bg-secondary/30 p-2 rounded">{finding.file_path}{finding.line_number ? `:${finding.line_number}` : ''}</code>
                </div>
              )}
              {finding.tool_name && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">Tool</h4>
                  <Badge variant="secondary">{finding.tool_name}</Badge>
                </div>
              )}
            </>
          )}

          {/* ASM details */}
          {finding.finding_type === 'asm' && (
            <>
              {finding.asset_type && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">Asset Type</h4>
                  <Badge variant="secondary">{finding.asset_type}</Badge>
                </div>
              )}
              {finding.port && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">Port</h4>
                  <code className="text-xs bg-secondary/30 p-2 rounded">{finding.port}</code>
                </div>
              )}
              {finding.protocol && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">Protocol</h4>
                  <Badge variant="secondary">{finding.protocol}</Badge>
                </div>
              )}
            </>
          )}

          {/* LLM details */}
          {finding.finding_type === 'llm' && (
            <>
              {finding.llm_category && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">LLM Vulnerability Category</h4>
                  <Badge variant="secondary" className={`${findingTypeConfig.llm.bgColor} ${findingTypeConfig.llm.color}`}>{finding.llm_category}</Badge>
                </div>
              )}
              {finding.prompt_example && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">Example Prompt</h4>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-secondary/30 p-3 rounded-lg font-mono">{finding.prompt_example}</pre>
                </div>
              )}
            </>
          )}

          {/* POC section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-primary">Proof of Concept (POC)</h4>
              <div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg,.png" onChange={handleFileUpload} />
                {canEditOrDeleteFinding && (
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    <Upload className="h-4 w-4 mr-1" />Upload POC
                  </Button>
                )}
              </div>
            </div>
            {findingPocs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {findingPocs.map(poc => {
                  const src = getPocSrc(poc.file_path);
                  return (
                    <div key={poc.id} className="relative group">
                      <img
                        src={src}
                        alt={poc.file_name}
                        className="rounded-lg border border-border/50 w-full h-32 object-cover cursor-pointer hover:opacity-80"
                        onClick={(e) => { e.stopPropagation(); window.open(src, '_blank'); }}
                      />
                      {!!userId && (String(poc.uploaded_by) === String(userId) || isModerator) && (
                        <button
                          type="button"
                          title="Delete POC"
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                          onClick={(e) => { e.stopPropagation(); handleDeletePoc(poc); }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 truncate">{poc.file_name}</p>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground">No POC images uploaded yet.</p>}
          </div>

          {/* Retest section */}
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
                              <span className="font-medium text-foreground/85">{getUsername(finding.retested_by)}</span>{' '}
                              on {new Date(finding.retest_date).toLocaleDateString()}
                            </>
                          ) : finding.retested_by ? (
                            <>
                              Lastly updated by:{' '}
                              <span className="font-medium text-foreground/85">{getUsername(finding.retested_by)}</span>
                            </>
                          ) : finding.retest_date ? (
                            <>Lastly updated: {new Date(finding.retest_date).toLocaleDateString()}</>
                          ) : null}
                        </span>
                      )}
                    </>
                  ) : <span className="text-sm text-muted-foreground">Not retested yet</span>}
                </div>
              </div>
              {canUpdateRetest ? (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Select value={finding.retest_status || ''} onValueChange={(v) => onUpdateRetest(finding.id, v as RetestStatus)}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Update status" /></SelectTrigger>
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

          {/* Footer */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground pt-2 border-t border-border/50">
            <span>Added by: {getUsername(finding.created_by)}</span>
            <span>Created: {new Date(finding.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </Card>

    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Edit finding</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveEdit} className="space-y-3 mt-2">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Severity *</Label>
            <Select value={editSeverity} onValueChange={(v) => setEditSeverity(v as Severity)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Informational">Informational</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} required />
          </div>
          <div className="space-y-2">
            <Label>Steps to reproduce</Label>
            <Textarea value={editSteps} onChange={(e) => setEditSteps(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Impact</Label>
            <Textarea value={editImpact} onChange={(e) => setEditImpact(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Remediation</Label>
            <Textarea value={editRemediation} onChange={(e) => setEditRemediation(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Affected component</Label>
              <Input value={editAffected} onChange={(e) => setEditAffected(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CVSS</Label>
              <Input value={editCvss} onChange={(e) => setEditCvss(e.target.value)} inputMode="decimal" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>CWE ID</Label>
            <Input value={editCwe} onChange={(e) => setEditCwe(e.target.value)} placeholder="CWE-79" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" className="gradient-technieum" disabled={editSaving}>
              {editSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}