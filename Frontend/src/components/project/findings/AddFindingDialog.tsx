import React, { useRef, useState } from 'react';
import { Upload, ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { findingTypeConfig } from '@/utils/severityHelpers';
import { authHeaders, authHeadersNoContent } from '@/hooks/useProjectData';
import type { Finding, FindingPoc, FindingType, Severity } from '@/utils/projectTypes';
import { API as API_BASE } from '@/utils/api';


type FormData = {
  severity: Severity | ''; title: string; description: string;
  stepsToReproduce: string; impact: string; remediation: string;
  affectedComponent: string; cvssScore: string; cweId: string;
  filePath: string; lineNumber: string; toolName: string;
  assetType: string; port: string; protocol: string;
  llmCategory: string; promptExample: string;
};

const defaultForm: FormData = {
  severity: '', title: '', description: '', stepsToReproduce: '',
  impact: '', remediation: '', affectedComponent: '', cvssScore: '', cweId: '',
  filePath: '', lineNumber: '', toolName: '',
  assetType: '', port: '', protocol: '',
  llmCategory: '', promptExample: '',
};

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  userId: string;
  findingType: FindingType;
  onSuccess: (finding: Finding, pocs: FindingPoc[]) => void;
};

export default function AddFindingDialog({ open, onClose, projectId, projectName, userId, findingType, onSuccess }: Props) {
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [pendingPocs, setPendingPocs] = useState<{ file: File; preview: string }[]>([]);
  const formPocInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFormData(defaultForm);
    pendingPocs.forEach(p => URL.revokeObjectURL(p.preview));
    setPendingPocs([]);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFormPocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter(f => ['image/jpeg', 'image/jpg', 'image/png'].includes(f.type));
    if (valid.length !== files.length) toast.error('Only JPEG and PNG files are allowed');
    setPendingPocs(prev => [...prev, ...valid.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
    if (formPocInputRef.current) formPocInputRef.current.value = '';
  };

  const removePendingPoc = (i: number) => {
    setPendingPocs(prev => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, idx) => idx !== i); });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) { toast.error('Title and description are required'); return; }
    if (!userId || !projectId) { toast.error('You must be logged in'); return; }
    try {
      const findingData: any = {
        project_id: projectId, title: formData.title, description: formData.description,
        severity: formData.severity || 'Medium', steps_to_reproduce: formData.stepsToReproduce || null,
        impact: formData.impact || null, remediation: formData.remediation || null,
        affected_component: formData.affectedComponent || null,
        cvss_score: formData.cvssScore ? parseFloat(formData.cvssScore) : null,
        cwe_id: formData.cweId || null, created_by: userId, finding_type: findingType,
      };
      if (findingType === 'sast') {
        findingData.file_path = formData.filePath || null;
        findingData.line_number = formData.lineNumber ? parseInt(formData.lineNumber) : null;
        findingData.tool_name = formData.toolName || null;
      } else if (findingType === 'asm') {
        findingData.asset_type = formData.assetType || null;
        findingData.port = formData.port ? parseInt(formData.port) : null;
        findingData.protocol = formData.protocol || null;
      } else if (findingType === 'llm') {
        findingData.llm_category = formData.llmCategory || null;
        findingData.prompt_example = formData.promptExample || null;
      }

      const res = await fetch(`${API_BASE}/findings`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(findingData) });
      if (!res.ok) { toast.error(`Failed to add finding: ${res.status}`); return; }
      const nf: Finding = await res.json();

      const uploadedPocs: FindingPoc[] = [];
      for (const { file } of pendingPocs) {
        const p = new FormData(); p.append('file', file); p.append('uploaded_by', userId);
        try {
          const r = await fetch(`${API_BASE}/findings/${nf.id}/pocs`, { method: 'POST', headers: authHeadersNoContent(), body: p });
          if (r.ok) uploadedPocs.push(await r.json());
        } catch (_) { }
      }

      toast.success(`${findingTypeConfig[findingType].label} finding added successfully!`);
      onSuccess(nf, uploadedPocs);
      reset();
      onClose();
    } catch (error) {
      console.error('Error adding finding:', error);
      toast.error('Failed to add finding');
    }
  };

  const TypeIcon = findingTypeConfig[findingType].Icon;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5 shrink-0" />
            Add {findingTypeConfig[findingType].label} Finding
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Project display */}
          <div className="space-y-2">
            <Label>Project</Label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-secondary/50 text-sm">
              <span className="flex-1 font-medium">{projectName}</span>
              <Badge variant="secondary" className="text-xs">Current Project</Badge>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input placeholder={`${findingTypeConfig[findingType].label} finding title`}
              value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea placeholder="Detailed description of the vulnerability" rows={3}
              value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
          </div>

          {/* Severity + CVSS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v as Severity })}>
                <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
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
              <Label>CVSS Score</Label>
              <Input placeholder="e.g., 9.8" type="number" step="0.1" min="0" max="10"
                value={formData.cvssScore} onChange={(e) => setFormData({ ...formData, cvssScore: e.target.value })} />
            </div>
          </div>

          {/* SAST-specific fields */}
          {findingType === 'sast' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>File Path</Label>
                  <Input placeholder="e.g., src/auth/login.js" value={formData.filePath}
                    onChange={(e) => setFormData({ ...formData, filePath: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Line Number</Label>
                  <Input placeholder="e.g., 42" type="number" value={formData.lineNumber}
                    onChange={(e) => setFormData({ ...formData, lineNumber: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tool Name</Label>
                <Input placeholder="e.g., Semgrep, Bandit, SonarQube" value={formData.toolName}
                  onChange={(e) => setFormData({ ...formData, toolName: e.target.value })} />
              </div>
            </>
          )}

          {/* ASM-specific fields */}
          {findingType === 'asm' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select value={formData.assetType} onValueChange={(v) => setFormData({ ...formData, assetType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select asset type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Server">Server</SelectItem>
                      <SelectItem value="Database">Database</SelectItem>
                      <SelectItem value="API">API</SelectItem>
                      <SelectItem value="Storage">Storage</SelectItem>
                      <SelectItem value="Domain">Domain</SelectItem>
                      <SelectItem value="IP">IP Address</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input placeholder="e.g., 443" type="number" value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Protocol</Label>
                <Input placeholder="e.g., HTTP, HTTPS, SSH" value={formData.protocol}
                  onChange={(e) => setFormData({ ...formData, protocol: e.target.value })} />
              </div>
            </>
          )}

          {/* LLM-specific fields */}
          {findingType === 'llm' && (
            <>
              <div className="space-y-2">
                <Label>LLM Vulnerability Category</Label>
                <Select value={formData.llmCategory} onValueChange={(v) => setFormData({ ...formData, llmCategory: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prompt Injection">Prompt Injection</SelectItem>
                    <SelectItem value="Jailbreak">Jailbreak</SelectItem>
                    <SelectItem value="Data Exfiltration">Data Exfiltration</SelectItem>
                    <SelectItem value="Excessive Agency">Excessive Agency</SelectItem>
                    <SelectItem value="Model Inversion">Model Inversion</SelectItem>
                    <SelectItem value="Supply Chain">Supply Chain</SelectItem>
                    <SelectItem value="Insecure Output">Insecure Output</SelectItem>
                    <SelectItem value="RAG Poisoning">RAG Poisoning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Example Prompt</Label>
                <Textarea placeholder="Example prompt that triggers the vulnerability" rows={3}
                  value={formData.promptExample} onChange={(e) => setFormData({ ...formData, promptExample: e.target.value })} />
              </div>
            </>
          )}

          {/* Pentest / SAST / ASM common fields */}
          {(findingType === 'pentest' || findingType === 'sast' || findingType === 'asm') && (
            <>
              <div className="space-y-2">
                <Label>CWE ID</Label>
                <Input placeholder="e.g., CWE-79" value={formData.cweId}
                  onChange={(e) => setFormData({ ...formData, cweId: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Affected Component</Label>
                <Input placeholder="e.g., /api/users" value={formData.affectedComponent}
                  onChange={(e) => setFormData({ ...formData, affectedComponent: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Steps to Reproduce</Label>
                <Textarea placeholder="Step-by-step instructions to reproduce" rows={4}
                  value={formData.stepsToReproduce} onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })} />
              </div>
            </>
          )}

          {/* Impact */}
          <div className="space-y-2">
            <Label>Impact</Label>
            <Textarea placeholder="Potential impact of this vulnerability" rows={2}
              value={formData.impact} onChange={(e) => setFormData({ ...formData, impact: e.target.value })} />
          </div>

          {/* Remediation */}
          <div className="space-y-2">
            <Label>Remediation</Label>
            <Textarea placeholder="Recommended remediation steps" rows={3}
              value={formData.remediation} onChange={(e) => setFormData({ ...formData, remediation: e.target.value })} />
          </div>

          {/* POC upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Proof of Concept (POC)</Label>
              {/* <Button type="button" variant="outline" size="sm" onClick={() => formPocInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" />Add Images
              </Button> */}
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
              <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => formPocInputRef.current?.click()}>
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload POC screenshots</p>
                <p className="text-xs text-muted-foreground mt-1">JPEG, PNG up to 10MB</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={reset}>Cancel</Button>
            </DialogClose>
            <Button type="submit" className="gradient-technieum">Submit Finding</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}