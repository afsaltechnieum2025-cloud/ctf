import { useEffect, useState, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Search, Plus, Trophy, ChevronDown, ChevronUp,
  Trash2, ShieldCheck, Bug, Star, BookOpen,
  Bold, Italic, List, Heading2, Quote, Code,
  AlignLeft, ExternalLink, Calendar,
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog';
import { API } from '@/utils/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'informational';
type Status = 'submitted' | 'triaged' | 'accepted' | 'rejected' | 'duplicate' | 'informative' | 'fixed';

interface HofFinding {
  id: number;
  user_id: number;
  project_id: string | null;
  researcher_name: string;
  researcher_full_name: string | null;
  researcher_role: string | null;
  program_name: string | null;
  platform: string | null;
  title: string;
  description: string | null;
  steps_to_reproduce: string | null;
  impact: string | null;
  severity: Severity;
  category: string | null;
  status: Status;
  cve_id: string | null;
  reported_at: string | null;
  resolved_at: string | null;
  public_url: string | null;
  blog_url: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  timeline?: TimelineEvent[];
}

interface TimelineEvent {
  id: number;
  event: string;
  event_date: string;
  actor: string;
}

interface AppUser {
  id: number;
  name: string;
  full_name: string | null;
  email: string;
  role: string;
}

interface Stats {
  total_findings: number;
  disclosure_count: number;
  cve_count: number;
  critical_high: number;
  program_count: number;
  researcher_count: number;
}

interface LeaderboardEntry {
  user_id: number;
  username: string;
  full_name: string | null;
  role: string;
  total_points: number;
  cve_count: number;
  finding_count: number;
  disclosure_count: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOF_API = `${API}/wof`;

const SEVERITY_CONFIG: Record<string, { label: string; cls: string }> = {
  critical:      { label: 'Critical',      cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  high:          { label: 'High',          cls: 'bg-primary/15 text-primary border-primary/30' },
  medium:        { label: 'Medium',        cls: 'bg-primary/10 text-primary/80 border-primary/20' },
  low:           { label: 'Low',           cls: 'bg-primary/5 text-primary/60 border-primary/10' },
  informational: { label: 'Info',          cls: 'bg-muted text-muted-foreground border-border' },
};

const STATUS_LABEL: Record<string, string> = {
  accepted:   'Disclosure',
  fixed:      'Disclosure',
  submitted:  'Submitted',
  triaged:    'Triaged',
  rejected:   'Rejected',
  duplicate:  'Duplicate',
  informative:'Informative',
};

const STATUS_CLS: Record<string, string> = {
  accepted:   'bg-primary/15 text-primary border-primary/30',
  fixed:      'bg-primary/15 text-primary border-primary/30',
  submitted:  'bg-muted text-muted-foreground border-border',
  triaged:    'bg-primary/10 text-primary/70 border-primary/20',
  rejected:   'bg-red-500/10 text-red-400 border-red-500/20',
  duplicate:  'bg-muted text-muted-foreground border-border',
  informative:'bg-muted text-muted-foreground border-border',
};

const AVATAR_COLORS = [
  'bg-primary/20 text-primary',
  'bg-red-500/20 text-red-400',
  'bg-primary/30 text-primary',
  'bg-primary/15 text-primary/80',
  'bg-red-400/20 text-red-300',
  'bg-primary/25 text-primary',
  'bg-red-500/15 text-red-400',
  'bg-primary/10 text-primary/70',
];

const TL_COLOR: Record<string, string> = {
  accepted: 'bg-primary', rejected: 'bg-red-500',
  triaged: 'bg-primary/60', fixed: 'bg-primary', default: 'bg-border',
};

const avatarColor = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
const initials    = (name: string) => (name ?? '?').slice(0, 2).toUpperCase();
const fmtDate     = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
const displayName = (f: HofFinding) =>
  f.researcher_full_name ? `${f.researcher_full_name} (@${f.researcher_name})` : `@${f.researcher_name}`;

const today = new Date().toISOString().split('T')[0];

const SEVERITY_VALUES = ['critical', 'high', 'medium', 'low', 'informational'] as const;
const STATUS_VALUES = ['submitted', 'triaged', 'accepted', 'rejected', 'duplicate', 'informative', 'fixed'] as const;

const RE_HOF_TITLE = /^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F]{3,300}$/;
const RE_HOF_DESCRIPTION = /^[^\x00]{10,20000}$/;
const RE_CVE_ID = /^CVE-(?:19|20)\d{2}-\d{4,12}$/i;

type HofAddFindingErrors = Partial<
  Record<
    | 'user_id'
    | 'title'
    | 'description'
    | 'severity'
    | 'status'
    | 'cve_id'
    | 'reported_at'
    | 'blog_content',
    string
  >
>;

type HofAddFindingForm = {
  user_id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  cve_id: string;
  reported_at: string;
  blog_content: string;
};

function htmlPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent || d.innerText || '').replace(/\s+/g, ' ').trim();
}

function isValidYmdNotFuture(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const parts = ymd.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  if (
    Number.isNaN(d.getTime()) ||
    d.getFullYear() !== parts[0] ||
    d.getMonth() !== parts[1] - 1 ||
    d.getDate() !== parts[2]
  ) {
    return false;
  }
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d <= t;
}

function validateHofAddFindingForm(form: HofAddFindingForm): HofAddFindingErrors {
  const errors: HofAddFindingErrors = {};

  if (!form.user_id.trim()) errors.user_id = 'Select a researcher.';

  const title = form.title.trim();
  if (!title) errors.title = 'Title is required.';
  else if (!RE_HOF_TITLE.test(title)) {
    errors.title = 'Use 3–300 characters; no control characters.';
  }

  const description = form.description.trim();
  if (!description) errors.description = 'Description is required.';
  else if (!RE_HOF_DESCRIPTION.test(description)) {
    errors.description = 'Use 10–20,000 characters (no null bytes).';
  }

  if (!SEVERITY_VALUES.includes(form.severity as (typeof SEVERITY_VALUES)[number])) {
    errors.severity = 'Select a valid severity.';
  }
  if (!STATUS_VALUES.includes(form.status as (typeof STATUS_VALUES)[number])) {
    errors.status = 'Select a valid status.';
  }

  const cve = form.cve_id.trim();
  if (!cve) errors.cve_id = 'CVE ID is required.';
  else if (!RE_CVE_ID.test(cve)) {
    errors.cve_id = 'Use CVE format: CVE-YYYY-NNNN (e.g., CVE-2024-12345).';
  }

  if (!form.reported_at) errors.reported_at = 'Reported date is required.';
  else if (!isValidYmdNotFuture(form.reported_at)) {
    errors.reported_at = 'Enter a valid calendar date (YYYY-MM-DD) not in the future.';
  }

  const plain = htmlPlainText(form.blog_content);
  if (!plain) errors.blog_content = 'Vulnerability write-up is required.';
  else if (plain.length < 50) {
    errors.blog_content = 'Write-up must contain at least 50 characters of text (excluding formatting).';
  } else if (plain.length > 100_000) {
    errors.blog_content = 'Write-up text is too long (max 100,000 characters).';
  } else if (form.blog_content.length > 500_000) {
    errors.blog_content = 'Write-up HTML is too large.';
  }

  return errors;
}

const SeverityBadge = ({ severity }: { severity: string }) => {
  const s = severity?.toLowerCase() ?? 'informational';
  const cfg = SEVERITY_CONFIG[s] ?? SEVERITY_CONFIG.informational;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const cls = STATUS_CLS[status] ?? STATUS_CLS.submitted;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
};

// ─── Rich Text Blog Editor ────────────────────────────────────────────────────

function BlogEditor({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    syncContent();
  };

  const syncContent = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const tools = [
    { icon: <Bold className="h-3.5 w-3.5" />, cmd: 'bold', title: 'Bold' },
    { icon: <Italic className="h-3.5 w-3.5" />, cmd: 'italic', title: 'Italic' },
    { icon: <Heading2 className="h-3.5 w-3.5" />, cmd: 'formatBlock', val: 'h3', title: 'Heading' },
    { icon: <List className="h-3.5 w-3.5" />, cmd: 'insertUnorderedList', title: 'Bullet list' },
    { icon: <Quote className="h-3.5 w-3.5" />, cmd: 'formatBlock', val: 'blockquote', title: 'Quote' },
    { icon: <Code className="h-3.5 w-3.5" />, cmd: 'formatBlock', val: 'pre', title: 'Code block' },
    { icon: <AlignLeft className="h-3.5 w-3.5" />, cmd: 'formatBlock', val: 'p', title: 'Paragraph' },
  ];

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden bg-secondary/20 focus-within:border-primary/50 transition-colors">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/40 bg-secondary/40 flex-wrap">
        {tools.map(t => (
          <button
            key={t.title}
            type="button"
            title={t.title}
            onMouseDown={e => { e.preventDefault(); exec(t.cmd, t.val); }}
            className="p-1.5 rounded hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
          >
            {t.icon}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={syncContent}
        onBlur={syncContent}
        data-placeholder={placeholder ?? 'Write your vulnerability write-up here…'}
        className="
          min-h-[220px] max-h-[420px] overflow-y-auto p-4 text-sm leading-relaxed outline-none
          text-foreground
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-primary [&_h3]:mt-4 [&_h3]:mb-2
          [&_p]:mb-2 [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2
          [&_li]:mb-1
          [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-2
          [&_pre]:bg-black/30 [&_pre]:rounded [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:overflow-x-auto [&_pre]:my-2
          [&_strong]:font-bold [&_strong]:text-foreground
          [&_em]:italic
          empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 empty:before:pointer-events-none
        "
      />
    </div>
  );
}

// ─── Blog Reader ──────────────────────────────────────────────────────────────

function BlogReader({ html }: { html: string }) {
  if (!html || html === '<br>' || html.trim() === '') return null;
  return (
    <div
      className="
        text-sm leading-relaxed text-muted-foreground
        [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2
        [&_p]:mb-2 [&_p]:leading-relaxed
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2
        [&_li]:mb-1
        [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-2
        [&_pre]:bg-black/30 [&_pre]:rounded [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:overflow-x-auto [&_pre]:my-2
        [&_strong]:font-bold [&_strong]:text-foreground
        [&_em]:italic
        [&_a]:text-primary [&_a]:underline
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Write-up Zoom Modal ──────────────────────────────────────────────────────

function WriteupModal({ finding, onClose }: { finding: HofFinding; onClose: () => void }) {
  return (
    <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
      <div className="flex items-start gap-4 px-6 py-4 border-b border-border/50 bg-secondary/20 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <SeverityBadge severity={finding.severity} />
            <StatusBadge status={finding.status} />
            {finding.cve_id && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-primary/10 text-primary border-primary/20">
                {finding.cve_id}
              </span>
            )}
          </div>
          <h2 className="text-base font-bold leading-snug pr-6">{finding.title}</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${avatarColor(finding.researcher_name)}`}>
              {initials(finding.researcher_name)}
            </div>
            <span className="text-xs text-muted-foreground">{displayName(finding)}</span>
            {(finding.reported_at || finding.created_at) && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{fmtDate(finding.reported_at || finding.created_at)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Vulnerability Write-up</h3>
        </div>
        <div className="rounded-lg border border-border/40 bg-secondary/10 p-5">
          <BlogReader html={finding.blog_url ?? ''} />
        </div>
      </div>
      <div className="shrink-0 px-6 py-3 border-t border-border/50 bg-secondary/10 flex justify-end">
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>
    </DialogContent>
  );
}

// ─── Add Finding Modal ────────────────────────────────────────────────────────

function AddFindingModal({ users, onClose, onSaved, token }: {
  users: AppUser[];
  onClose: () => void;
  onSaved: () => void;
  token: string;
}) {
  const [form, setForm] = useState({
    user_id: '',
    title: '',
    description: '',
    severity: 'medium',
    status: 'submitted',
    cve_id: '',
    reported_at: '',
    blog_content: '',
  });
  const [formErrors, setFormErrors] = useState<HofAddFindingErrors>({});
  const [saving, setSaving] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const clearField = (key: keyof HofAddFindingErrors) => {
    setFormErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    try { el.showPicker(); } catch { el.click(); }
  };

  const save = async () => {
    const validation = validateHofAddFindingForm({
      user_id: form.user_id,
      title: form.title,
      description: form.description,
      severity: form.severity,
      status: form.status,
      cve_id: form.cve_id,
      reported_at: form.reported_at,
      blog_content: form.blog_content,
    });
    setFormErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${HOF_API}/findings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_id: Number(form.user_id),
          title: form.title.trim(),
          description: form.description.trim(),
          severity: form.severity,
          status: form.status,
          cve_id: form.cve_id.trim().toUpperCase(),
          reported_at: form.reported_at,
          blog_url: form.blog_content,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }
      toast.success('Finding added!');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save finding.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-primary" />
          Add New Finding
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Researcher *</Label>
          <Select
            value={form.user_id}
            onValueChange={v => {
              clearField('user_id');
              setForm(f => ({ ...f, user_id: v }));
            }}
          >
            <SelectTrigger className={cn(formErrors.user_id && 'border-destructive')}>
              <SelectValue placeholder="Select researcher" />
            </SelectTrigger>
            <SelectContent>
              {users.map(u => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.full_name ? `${u.full_name} (@${u.name})` : `@${u.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.user_id ? <p className="text-xs text-destructive">{formErrors.user_id}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Title *</Label>
          <Input
            placeholder="e.g. IDOR in /api/users/:id allows horizontal privilege escalation"
            value={form.title}
            onChange={e => {
              clearField('title');
              setForm(f => ({ ...f, title: e.target.value }));
            }}
            className={cn(formErrors.title && 'border-destructive')}
          />
          {formErrors.title ? (
            <p className="text-xs text-destructive">{formErrors.title}</p>
          ) : (
            <p className="text-xs text-muted-foreground">3–300 characters, no control characters</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Description *</Label>
          <textarea
            rows={3}
            placeholder="Brief summary of the vulnerability — what it is and where it was found…"
            value={form.description}
            onChange={e => {
              clearField('description');
              setForm(f => ({ ...f, description: e.target.value }));
            }}
            className={cn(
              'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none',
              formErrors.description && 'border-destructive focus:ring-destructive',
            )}
          />
          {formErrors.description ? (
            <p className="text-xs text-destructive">{formErrors.description}</p>
          ) : (
            <p className="text-xs text-muted-foreground">10–20,000 characters</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Severity *</Label>
            <Select
              value={form.severity}
              onValueChange={v => {
                clearField('severity');
                setForm(f => ({ ...f, severity: v }));
              }}
            >
              <SelectTrigger className={cn(formErrors.severity && 'border-destructive')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['critical', 'high', 'medium', 'low', 'informational'].map(s => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.severity ? <p className="text-xs text-destructive">{formErrors.severity}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Status *</Label>
            <Select
              value={form.status}
              onValueChange={v => {
                clearField('status');
                setForm(f => ({ ...f, status: v }));
              }}
            >
              <SelectTrigger className={cn(formErrors.status && 'border-destructive')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['submitted', 'triaged', 'accepted', 'rejected', 'duplicate', 'informative', 'fixed'].map(s => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s] ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.status ? <p className="text-xs text-destructive">{formErrors.status}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>CVE ID *</Label>
            <Input
              placeholder="CVE-2025-12345"
              value={form.cve_id}
              onChange={e => {
                clearField('cve_id');
                setForm(f => ({ ...f, cve_id: e.target.value }));
              }}
              className={cn(formErrors.cve_id && 'border-destructive')}
            />
            {formErrors.cve_id ? (
              <p className="text-xs text-destructive">{formErrors.cve_id}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Format: CVE-YYYY-NNNN+</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Reported Date *</Label>
            <div
              onClick={openDatePicker}
              className={cn(
                'relative flex items-center h-10 rounded-md border border-input bg-background px-3 gap-2 cursor-pointer hover:border-primary/50 transition-colors select-none',
                formErrors.reported_at && 'border-destructive',
              )}
            >
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className={`text-sm flex-1 ${form.reported_at ? 'text-foreground' : 'text-muted-foreground'}`}>
                {form.reported_at
                  ? new Date(form.reported_at + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                  : 'Select date'
                }
              </span>
              <input
                ref={dateInputRef}
                type="date"
                value={form.reported_at}
                max={today}
                onChange={e => {
                  clearField('reported_at');
                  setForm(f => ({ ...f, reported_at: e.target.value }));
                }}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                tabIndex={-1}
              />
            </div>
            {formErrors.reported_at ? <p className="text-xs text-destructive">{formErrors.reported_at}</p> : null}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Vulnerability Write-up *
          </Label>
          <div
            className={cn(
              'rounded-lg overflow-hidden',
              formErrors.blog_content && 'ring-2 ring-destructive ring-offset-2 ring-offset-background',
            )}
          >
            <BlogEditor
              value={form.blog_content}
              onChange={v => {
                clearField('blog_content');
                setForm(f => ({ ...f, blog_content: v }));
              }}
              placeholder="Write a detailed vulnerability write-up…"
            />
          </div>
          {formErrors.blog_content ? (
            <p className="text-xs text-destructive">{formErrors.blog_content}</p>
          ) : (
            <p className="text-xs text-muted-foreground">At least 50 characters of visible text (formatting does not count).</p>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </DialogClose>
          <Button className="gradient-technieum" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Submit Finding'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ finding, onClose, onUpdate, token, isAdmin }: {
  finding: HofFinding;
  onClose: () => void;
  onUpdate: () => void;
  token: string;
  isAdmin: boolean;
}) {
  const [statusVal, setStatusVal]     = useState(finding.status);
  const [cveVal, setCveVal]           = useState(finding.cve_id ?? '');
  const [rejectVal, setRejectVal]     = useState(finding.rejection_reason ?? '');
  const [blogContent, setBlogContent] = useState(finding.blog_url ?? '');
  const [saving, setSaving]           = useState(false);

  const patch = async () => {
    setSaving(true);
    try {
      await fetch(`${HOF_API}/findings/${finding.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: statusVal,
          cve_id: cveVal || null,
          rejection_reason: rejectVal || null,
          blog_url: blogContent || null,
        }),
      });
      if (statusVal !== finding.status) {
        const evtMap: Record<string, string> = {
          accepted: 'Accepted — marked as disclosure',
          rejected: `Rejected${rejectVal ? ': ' + rejectVal : ''}`,
          triaged: 'Triaged by security team',
          fixed: 'Marked as fixed',
        };
        if (evtMap[statusVal]) {
          await fetch(`${HOF_API}/findings/${finding.id}/timeline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ event: evtMap[statusVal], actor: 'user' }),
          });
        }
      }
      toast.success('Finding updated!');
      onUpdate();
      onClose();
    } catch {
      toast.error('Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-base font-semibold leading-snug pr-6">{finding.title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-5 mt-2">
        <div className="flex flex-wrap gap-2">
          <SeverityBadge severity={finding.severity} />
          <StatusBadge status={finding.status} />
          {finding.cve_id && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-primary/10 text-primary border-primary/20">
              {finding.cve_id}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor(finding.researcher_name)}`}>
            {initials(finding.researcher_name)}
          </div>
          <div>
            <p className="text-sm font-semibold">{displayName(finding)}</p>
            <p className="text-xs text-muted-foreground">
              {finding.program_name && `${finding.program_name} · `}
              {fmtDate(finding.reported_at || finding.created_at)}
            </p>
          </div>
        </div>
        {finding.description && (
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Problem Statement</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{finding.description}</p>
          </div>
        )}
        {finding.impact && (
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Impact</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{finding.impact}</p>
          </div>
        )}
        {finding.steps_to_reproduce && (
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Steps to Reproduce</h4>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-secondary/30 p-3 rounded-lg">
              {finding.steps_to_reproduce}
            </pre>
          </div>
        )}
        {finding.blog_url && (
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />Vulnerability Write-up
            </h4>
            <div className="rounded-lg border border-border/40 bg-secondary/10 p-4">
              <BlogReader html={finding.blog_url} />
            </div>
          </div>
        )}
        {finding.rejection_reason && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-red-400 mb-1">Rejection Reason</h4>
            <p className="text-sm text-muted-foreground">{finding.rejection_reason}</p>
          </div>
        )}
        {finding.timeline && finding.timeline.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Timeline</h4>
            <div className="space-y-3">
              {finding.timeline.map(t => {
                const key = t.event.toLowerCase().includes('accept') ? 'accepted'
                  : t.event.toLowerCase().includes('reject') ? 'rejected'
                    : t.event.toLowerCase().includes('triage') ? 'triaged'
                      : t.event.toLowerCase().includes('fix') ? 'fixed'
                        : 'default';
                return (
                  <div key={t.id} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TL_COLOR[key]}`} />
                    <div>
                      <p className="text-sm">{t.event}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(t.event_date)} · {t.actor}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {isAdmin && (
          <div className="border-t border-border/50 pt-4 space-y-4">
            <h4 className="text-sm font-semibold text-primary">Update Finding</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusVal} onValueChange={v => setStatusVal(v as Status)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['submitted', 'triaged', 'accepted', 'rejected', 'duplicate', 'informative', 'fixed'].map(s => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s] ?? s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CVE ID</Label>
                <Input placeholder="CVE-2025-XXXX" value={cveVal} onChange={e => setCveVal(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Rejection Reason</Label>
                <Input placeholder="Out of scope…" value={rejectVal} onChange={e => setRejectVal(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />Edit Write-up
              </Label>
              <BlogEditor value={blogContent} onChange={setBlogContent} />
            </div>
            <div className="flex justify-end">
              <Button className="gradient-technieum" disabled={saving} onClick={patch}>
                {saving ? 'Updating…' : 'Update Finding'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

// ─── Researcher Profile Modal ─────────────────────────────────────────────────

function ResearcherModal({ entry, allFindings, onClose, onOpenFinding }: {
  entry: LeaderboardEntry;
  allFindings: HofFinding[];
  onClose: () => void;
  onOpenFinding: (f: HofFinding) => void;
}) {
  const disclosureFindings = allFindings.filter(
    f => f.user_id === entry.user_id && (f.status === 'accepted' || f.status === 'fixed')
  );
  const cveFindings = allFindings.filter(f => f.user_id === entry.user_id && !!f.cve_id);

  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor(entry.username)}`}>
            {initials(entry.username)}
          </div>
          <div>
            <p className="font-bold">{entry.full_name ?? `@${entry.username}`}</p>
            <p className="text-xs text-muted-foreground font-normal">@{entry.username} · {entry.role}</p>
          </div>
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-5 mt-2">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Points',      value: entry.total_points,    cls: 'text-primary',     border: 'border-primary/20',  bg: 'bg-primary/5' },
            { label: 'Disclosures', value: entry.disclosure_count, cls: 'text-primary/80', border: 'border-primary/15',  bg: 'bg-primary/5' },
            { label: 'CVEs',        value: entry.cve_count,        cls: 'text-red-400',    border: 'border-red-500/20',  bg: 'bg-red-500/5' },
          ].map(({ label, value, cls, border, bg }) => (
            <div key={label} className={`rounded-lg border ${border} ${bg} p-3 text-center`}>
              <p className={`text-xl font-bold ${cls}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        {cveFindings.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">CVEs</p>
            <div className="flex flex-wrap gap-2">
              {cveFindings.map(f => (
                <button key={f.id} onClick={() => { onClose(); onOpenFinding(f); }}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                  {f.cve_id}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Disclosures ({disclosureFindings.length})
          </p>
          {disclosureFindings.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No accepted disclosures yet</p>
          ) : (
            <div className="space-y-2">
              {disclosureFindings.map(f => (
                <button key={f.id} onClick={() => { onClose(); onOpenFinding(f); }}
                  className="w-full text-left p-3 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-all group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <SeverityBadge severity={f.severity} />
                        {f.cve_id && <span className="text-xs font-mono text-primary/70">{f.cve_id}</span>}
                      </div>
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{f.title}</p>
                      {f.program_name && <p className="text-xs text-muted-foreground mt-0.5">{f.program_name}</p>}
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1 transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{fmtDate(f.reported_at || f.created_at)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </DialogContent>
  );
}

// ─── Finding Card ─────────────────────────────────────────────────────────────

function FindingCard({ f, index, onDetail, onDelete, onWriteup, isAdmin }: {
  f: HofFinding;
  index: number;
  onDetail: (f: HofFinding) => void;
  onDelete: (id: number) => void;
  onWriteup: (f: HofFinding) => void;
  isAdmin: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden transition-all hover:border-primary/20" style={{ animationDelay: `${index * 30}ms` }}>
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(p => !p)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <SeverityBadge severity={f.severity} />
              <StatusBadge status={f.status} />
              {f.cve_id && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-primary/10 text-primary border-primary/20">
                  {f.cve_id}
                </span>
              )}
              {f.blog_url && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onWriteup(f); }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-primary/5 text-primary/60 border-primary/10 hover:bg-primary/15 hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <BookOpen className="h-2.5 w-2.5" />Write-up
                </button>
              )}
            </div>
            <h3 className="font-semibold text-sm">{f.title}</h3>
            {f.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{f.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); onDelete(f.id); }}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            )}
            {expanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </div>
        {/* Mobile: two lines — name on first, program+date on second */}
        <div className="mt-3 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-xs text-muted-foreground truncate">{displayName(f)}</span>
          <div className="flex items-center gap-2">
            {f.program_name && (
              <span className="text-xs text-muted-foreground truncate">· {f.program_name}</span>
            )}
            {f.reported_at && (
              <span className="text-xs text-muted-foreground sm:ml-auto whitespace-nowrap">{fmtDate(f.reported_at)}</span>
            )}
          </div>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-4">
          {f.impact && (
            <div>
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Impact</h4>
              <p className="text-sm text-muted-foreground">{f.impact}</p>
            </div>
          )}
          {f.steps_to_reproduce && (
            <div>
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Steps to Reproduce</h4>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-secondary/30 p-3 rounded-lg text-xs">
                {f.steps_to_reproduce}
              </pre>
            </div>
          )}
          {f.blog_url && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3" />Write-up
                </h4>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onWriteup(f); }}
                  className="text-xs text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />Open full
                </button>
              </div>
              <div
                className="rounded-lg border border-border/40 bg-secondary/10 p-4 max-h-[200px] overflow-hidden relative cursor-pointer group"
                onClick={e => { e.stopPropagation(); onWriteup(f); }}
              >
                <BlogReader html={f.blog_url} />
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-secondary/60 to-transparent rounded-b-lg flex items-end justify-center pb-2">
                  <span className="text-[10px] text-primary/50 group-hover:text-primary transition-colors font-medium">
                    Click to read full write-up ↗
                  </span>
                </div>
              </div>
            </div>
          )}
          {f.rejection_reason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Rejection Reason</h4>
              <p className="text-sm text-muted-foreground">{f.rejection_reason}</p>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <span className="text-xs text-muted-foreground">
              Reported: {fmtDate(f.reported_at || f.created_at)}
            </span>
            <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); onDetail(f); }}>
              View Details{isAdmin ? ' & Update' : ''}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Leaderboard Row (mobile-aware) ──────────────────────────────────────────

function LeaderboardRow({ r, rank, onClick }: {
  r: LeaderboardEntry;
  rank: number;
  onClick: () => void;
}) {
  const medals = ['🥇', '🥈', '🥉'];
  const rankLabel = medals[rank] ?? `#${rank + 1}`;

  return (
    <div
      className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:grid-cols-[2.5rem_minmax(0,5fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,2fr)] items-center gap-x-2 gap-y-1 sm:gap-x-4 sm:gap-y-0 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border/20 last:border-0 cursor-pointer hover:bg-secondary/20 transition-colors"
      onClick={onClick}
    >
      {/* Col 1 — Rank */}
      <span className="flex h-9 w-full items-center justify-center text-sm font-bold tabular-nums text-muted-foreground sm:h-auto sm:text-sm">
        {rankLabel}
      </span>

      {/* Col 2 — Name + username */}
      <div className="min-w-0 pr-1 sm:pr-0">
        <p className="text-xs font-semibold leading-tight sm:text-sm truncate">
          {r.full_name ?? `@${r.username}`}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:mt-0 sm:text-xs">@{r.username}</p>
      </div>

      {/* Mobile: D + C + points in one row (wraps if needed) */}
      <div className="flex min-w-0 max-w-[11.5rem] flex-row flex-wrap items-center justify-end gap-1 sm:hidden">
        <span className="inline-flex shrink-0 items-center rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          {r.disclosure_count} D
        </span>
        <span className="inline-flex shrink-0 items-center rounded-full border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
          {r.cve_count} C
        </span>
        <span className="inline-flex shrink-0 items-center rounded-md border border-primary/15 bg-primary/5 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary">
          {r.total_points}
        </span>
      </div>

      {/* Col 3 — Disclosures (desktop only) */}
      <div className="hidden min-w-0 justify-center px-2 sm:flex sm:px-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
          {r.disclosure_count} D
        </span>
      </div>

      {/* Col 4 — CVEs (desktop only) */}
      <div className="hidden min-w-0 justify-center px-2 sm:flex sm:px-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 whitespace-nowrap">
          {r.cve_count} C
        </span>
      </div>

      {/* Col 5 — Points (desktop only) */}
      <div className="hidden min-w-0 text-right sm:block sm:px-3">
        <p className="text-sm font-bold text-primary leading-tight">{r.total_points}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WallofFame() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'admin';

  type TabType = 'all' | 'disclosure' | 'cves' | 'leaderboard';
  const [tab, setTab]                   = useState<TabType>(isAdmin ? 'all' : 'disclosure');
  const [findings, setFindings]         = useState<HofFinding[]>([]);
  const [users, setUsers]               = useState<AppUser[]>([]);
  const [leaderboard, setLeaderboard]   = useState<LeaderboardEntry[]>([]);
  const [stats, setStats]               = useState<Stats | null>(null);
  const [search, setSearch]             = useState('');
  const [showAdd, setShowAdd]           = useState(false);
  const [detailFinding, setDetailFinding]   = useState<HofFinding | null>(null);
  const [writeupFinding, setWriteupFinding] = useState<HofFinding | null>(null);
  const [deletingId, setDeletingId]     = useState<number | null>(null);
  const [profileEntry, setProfileEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading]           = useState(true);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const [fRes, uRes, sRes] = await Promise.all([
        fetch(`${HOF_API}/findings?${params}`, { headers }),
        fetch(`${API}/users`, { headers }),
        fetch(`${HOF_API}/stats`, { headers }),
      ]);
      if (fRes.ok) setFindings(await fRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (sRes.ok) setStats(await sRes.json());
      if (user?.role === 'admin') {
        const lRes = await fetch(`${HOF_API}/leaderboard`, { headers });
        if (lRes.ok) setLeaderboard(await lRes.json());
        else setLeaderboard([]);
      } else {
        setLeaderboard([]);
      }
    } catch { toast.error('Failed to load data.'); }
    finally { setLoading(false); }
  }, [search, token, user?.role]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (tab === 'leaderboard' && user?.role !== 'admin') {
      setTab('disclosure');
    }
  }, [tab, user?.role]);

  const openDetail = async (f: HofFinding) => {
    try {
      const res = await fetch(`${HOF_API}/findings/${f.id}`, { headers });
      setDetailFinding(res.ok ? await res.json() : f);
    } catch { setDetailFinding(f); }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`${HOF_API}/findings/${deletingId}`, { method: 'DELETE', headers });
      toast.success('Finding deleted.');
      setDeletingId(null);
      loadAll();
    } catch { toast.error('Failed to delete.'); }
  };

  const allFindings        = findings.filter(f => f.status !== 'rejected' && f.status !== 'duplicate');
  const disclosureFindings = findings.filter(f => f.status === 'accepted' || f.status === 'fixed');
  const cveFindings        = findings.filter(f => !!f.cve_id);

  const tabFindings: Record<string, HofFinding[]> = {
    all: allFindings, disclosure: disclosureFindings, cves: cveFindings,
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    ...(isAdmin ? [{ key: 'all' as TabType, label: 'All Findings', icon: <Bug className="h-3.5 w-3.5 shrink-0 text-foreground" />, count: allFindings.length }] : []),
    { key: 'disclosure', label: 'Disclosure', icon: <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-foreground" />, count: disclosureFindings.length },
    { key: 'cves',       label: 'CVEs',       icon: <Star className="h-3.5 w-3.5 shrink-0 text-foreground" />,       count: cveFindings.length },
    ...(user?.role === 'admin'
      ? [{ key: 'leaderboard' as TabType, label: 'Leaderboard', icon: <Trophy className="h-3.5 w-3.5 shrink-0 text-foreground" /> }]
      : []),
  ];

  const statCards = stats ? [
    { label: 'Disclosures',   value: stats.disclosure_count, cls: 'text-primary',    border: 'border-primary/20',  bg: 'bg-primary/5' },
    { label: 'CVEs Assigned', value: stats.cve_count,        cls: 'text-red-400',    border: 'border-red-500/20',  bg: 'bg-red-500/5' },
    { label: 'Critical/High', value: stats.critical_high,    cls: 'text-red-400',    border: 'border-red-500/20',  bg: 'bg-red-500/5' },
    { label: 'Researchers',   value: stats.researcher_count, cls: 'text-primary/60', border: 'border-border/60',   bg: 'bg-secondary/30' },
  ] : [];

  return (
    <DashboardLayout
      title="Wall of Fame"
      description="Bug bounty & vulnerability wall of fame — every find, every researcher, every reward."
    >
      <div className="space-y-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {statCards.map(({ label, value, cls, border, bg }) => (
              <Card key={label} className={`p-4 border ${border} ${bg}`}>
                <p className={`text-2xl font-bold ${cls}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Search + New Finding */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search findings, researchers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <Button className="gradient-technieum shrink-0" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-2" />New Finding
            </Button>
            {showAdd && (
              <AddFindingModal
                users={users}
                onClose={() => setShowAdd(false)}
                onSaved={loadAll}
                token={token ?? ''}
              />
            )}
          </Dialog>
        </div>

        {/* Tabs — same pattern as Trending category tabs / sidebar nav */}
        <div className="flex max-w-full flex-nowrap gap-1 overflow-x-auto rounded-lg bg-secondary/40 p-1 [-webkit-overflow-scrolling:touch] scrollbar-hide">
          {tabs.map(({ key, label, icon, count }) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {icon}
                {label}
                {count !== undefined && count > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                      isActive ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Leaderboard ── */}
        {tab === 'leaderboard' && (
          <div className="space-y-3">
            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                Disclosure = 10 pts
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                CVE = 50 pts
              </span>
            </div>

            {loading ? (
              <Card className="p-12 text-center">
                <p className="text-sm text-muted-foreground">Loading…</p>
              </Card>
            ) : leaderboard.length === 0 ? (
              <Card className="p-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No researchers yet</p>
              </Card>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:grid-cols-[2.5rem_minmax(0,5fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,2fr)] items-center gap-x-2 sm:gap-x-4 px-3 sm:px-4 py-2.5 bg-secondary/40 border-b border-border/50">
                  <span className="flex items-center justify-center text-xs font-semibold text-muted-foreground">#</span>
                  <span className="min-w-0 text-xs font-semibold text-muted-foreground">Researcher</span>
                  {/* mobile: single "Stats" label; desktop: three separate labels */}
                  <span className="max-w-[11.5rem] text-right text-xs font-semibold text-muted-foreground sm:hidden">Stats</span>
                  <span className="hidden min-w-0 justify-center px-2 text-center text-xs font-semibold text-muted-foreground sm:flex sm:px-3">Disclosures</span>
                  <span className="hidden min-w-0 justify-center px-2 text-center text-xs font-semibold text-muted-foreground sm:flex sm:px-3">CVEs</span>
                  <span className="hidden min-w-0 px-2 text-right text-xs font-semibold text-muted-foreground sm:block sm:px-3">Points</span>
                </div>

                {/* Rows — shared component handles both layouts */}
                {leaderboard.map((r, i) => (
                  <LeaderboardRow
                    key={r.user_id}
                    r={r}
                    rank={i}
                    onClick={() => setProfileEntry(r)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Findings list */}
        {tab !== 'leaderboard' && (
          <div className="space-y-3">
            {loading ? (
              <Card className="p-12 text-center">
                <p className="text-sm text-muted-foreground">Loading findings…</p>
              </Card>
            ) : tabFindings[tab].length === 0 ? (
              <Card className="p-12 text-center">
                <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">
                  {tab === 'disclosure' ? 'No disclosures yet' : tab === 'cves' ? 'No CVEs yet' : 'No findings found'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {tab === 'all' ? 'Add your first finding to get started.' : 'Findings will appear here once added.'}
                </p>
              </Card>
            ) : tabFindings[tab].map((f, index) => (
              <FindingCard
                key={f.id}
                f={f}
                index={index}
                onDetail={openDetail}
                onDelete={id => setDeletingId(id)}
                onWriteup={f => setWriteupFinding(f)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detailFinding} onOpenChange={open => !open && setDetailFinding(null)}>
        {detailFinding && (
          <DetailModal finding={detailFinding} onClose={() => setDetailFinding(null)}
            onUpdate={loadAll} token={token ?? ''} isAdmin={isAdmin} />
        )}
      </Dialog>

      {/* Write-up zoom modal */}
      <Dialog open={!!writeupFinding} onOpenChange={open => !open && setWriteupFinding(null)}>
        {writeupFinding && (
          <WriteupModal finding={writeupFinding} onClose={() => setWriteupFinding(null)} />
        )}
      </Dialog>

      {/* Researcher profile dialog */}
      <Dialog open={!!profileEntry} onOpenChange={open => !open && setProfileEntry(null)}>
        {profileEntry && (
          <ResearcherModal entry={profileEntry} allFindings={findings}
            onClose={() => setProfileEntry(null)}
            onOpenFinding={f => { setProfileEntry(null); setTimeout(() => openDetail(f), 100); }} />
        )}
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deletingId} onOpenChange={open => !open && setDeletingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />Delete Finding
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? This cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}