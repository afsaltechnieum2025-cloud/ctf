import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Bug, ShieldCheck, Globe, Brain, Bot, AlertTriangle, KeyRound, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Severity, FindingType } from './projectTypes';

/** Canonical icons for product areas — use app-wide (sidebar, reports, findings, trending, etc.) */
export const FINDING_TYPE_LUCIDE: Record<FindingType, LucideIcon> = {
  pentest: Bug,
  sast: ShieldCheck,
  asm: Globe,
  llm: Bot,
  secret: KeyRound,
};

export const SCA_LUCIDE_ICON: LucideIcon = Package;
/** TOIP / intelligence portal — distinct from LLM findings (`Bot`) */
export const TOIP_LUCIDE_ICON: LucideIcon = Brain;

export function FindingTypeLucideIcon({ type, className = 'h-4 w-4' }: { type: FindingType; className?: string }) {
  const Icon = FINDING_TYPE_LUCIDE[type];
  return <Icon className={className} />;
}

/** Overview / tabs: finding types plus SCA (Package); TOIP uses `TOIP_LUCIDE_ICON` (`Brain`) */
export function FindingOverviewTypeIcon({ type, className = 'h-4 w-4' }: { type: FindingType | 'sca'; className?: string }) {
  const Icon = type === 'sca' ? SCA_LUCIDE_ICON : FINDING_TYPE_LUCIDE[type];
  return <Icon className={className} />;
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

export const normalizeSeverity = (s: string | number | null | undefined): Severity => {
  const map: Record<string, Severity> = {
    critical: 'Critical', high: 'High', medium: 'Medium',
    low: 'Low', informational: 'Informational', info: 'Informational',
  };
  const raw = String(s ?? '').toLowerCase().trim();
  if (map[raw]) return map[raw];
  const n = parseFloat(raw);
  if (!isNaN(n) && raw !== '') {
    if (n >= 9) return 'Critical';
    if (n >= 7) return 'High';
    if (n >= 4) return 'Medium';
    return 'Low';
  }
  return 'Informational';
};

/** Stat summary cards (global Findings page & project Findings tab) — same palette */
export const SEVERITY_STAT_CARD_STYLES: Record<Severity, { bg: string; text: string; border: string }> = {
  Critical:      { bg: 'bg-red-500/10',    text: 'text-red-500',          border: 'border-red-500/30'    },
  High:          { bg: 'bg-orange-500/10', text: 'text-orange-500',       border: 'border-orange-500/30' },
  Medium:        { bg: 'bg-orange-400/10', text: 'text-orange-400',       border: 'border-orange-400/30' },
  Low:           { bg: 'bg-primary/5',     text: 'text-primary/50',       border: 'border-primary/15'    },
  Informational: { bg: 'bg-muted',         text: 'text-muted-foreground', border: 'border-border'        },
};

export function SeverityStatCardIcon({ severity }: { severity: Severity }) {
  const { text } = SEVERITY_STAT_CARD_STYLES[severity];
  return <AlertTriangle className={cn('h-5 w-5', text)} />;
}

export const SEV: Record<Severity, { bg: string; text: string; border: string }> = {
  Critical:      { bg: 'bg-severity-critical/12', text: 'text-severity-critical', border: 'border-severity-critical/35' },
  High:          { bg: 'bg-severity-high/12',     text: 'text-severity-high',     border: 'border-severity-high/30' },
  Medium:        { bg: 'bg-severity-medium/10',   text: 'text-severity-medium',   border: 'border-severity-medium/30' },
  Low:           { bg: 'bg-severity-low/10',      text: 'text-severity-low',      border: 'border-severity-low/30' },
  Informational: { bg: 'bg-muted/50',             text: 'text-muted-foreground',  border: 'border-border/60' },
};

export const getSeverityBadge = (s: string | number | null | undefined) => {
  const n = normalizeSeverity(s);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${SEV[n].bg} ${SEV[n].text} ${SEV[n].border}`}>
      {n}
    </span>
  );
};

export const getSeverityIcon = (s: string | number | null | undefined) => {
  const n = normalizeSeverity(s);
  if (n === 'Critical') return <AlertTriangle className="h-5 w-5 text-severity-critical" />;
  if (n === 'High') return <AlertTriangle className="h-5 w-5 text-severity-high" />;
  if (n === 'Medium') return <Bug className="h-5 w-5 text-severity-medium" />;
  if (n === 'Low') return <Bug className="h-5 w-5 text-severity-low" />;
  return <Bug className="h-5 w-5 text-muted-foreground" />;
};

export const getRetestBadge = (status: string | null | undefined) => {
  if (!status) return null;
  const map: Record<string, { bg: string; text: string; border: string }> = {
    'Fixed':     { bg: 'bg-green-500/10',  text: 'text-green-500',  border: 'border-green-500/30' },
    'Not Fixed': { bg: 'bg-red-500/10',    text: 'text-red-500',    border: 'border-red-500/30'   },
    'Open':      { bg: 'bg-muted/50',       text: 'text-muted-foreground', border: 'border-border/60' },
  };
  const style = map[status] ?? map['Open'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
      {status}
    </span>
  );
};

// ─── Finding type config ──────────────────────────────────────────────────────

export const findingTypeConfig: Record<FindingType, {
  label: string;
  Icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  fields: string[];
}> = {
  pentest: {
    label: 'Pentest', Icon: FINDING_TYPE_LUCIDE.pentest, color: 'text-primary',
    bgColor: 'bg-primary/10', borderColor: 'border-primary/20',
    fields: ['severity', 'cvss_score', 'cwe_id', 'affected_component', 'steps_to_reproduce', 'impact', 'remediation'],
  },
  sast: {
    label: 'SAST', Icon: FINDING_TYPE_LUCIDE.sast, color: 'text-severity-info',
    bgColor: 'bg-severity-info/10', borderColor: 'border-severity-info/25',
    fields: ['severity', 'file_path', 'line_number', 'tool_name', 'cwe_id', 'remediation'],
  },
  asm: {
    label: 'ASM', Icon: FINDING_TYPE_LUCIDE.asm, color: 'text-accent',
    bgColor: 'bg-accent/10', borderColor: 'border-accent/25',
    fields: ['severity', 'asset_type', 'port', 'protocol', 'remediation'],
  },
  llm: {
    label: 'LLM/AI', Icon: FINDING_TYPE_LUCIDE.llm, color: 'text-green-500',
    bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20',
    fields: ['severity', 'llm_category', 'prompt_example', 'impact', 'remediation'],
  },
  secret: {
    label: 'Secret', Icon: FINDING_TYPE_LUCIDE.secret, color: 'text-amber-400',
    bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20',
    fields: ['severity', 'affected_component', 'tool_name', 'file_path', 'description', 'remediation'],
  },
};