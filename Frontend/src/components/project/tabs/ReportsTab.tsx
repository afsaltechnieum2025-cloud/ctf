import { FileText, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Finding, FindingType } from '@/utils/projectTypes';
import { findingTypeConfig, SCA_LUCIDE_ICON, TOIP_LUCIDE_ICON } from '@/utils/severityHelpers';

const SastReportIcon = findingTypeConfig.sast.Icon;
const AsmReportIcon = findingTypeConfig.asm.Icon;
const LlmReportIcon = findingTypeConfig.llm.Icon;
const SecretReportIcon = findingTypeConfig.secret.Icon;

// ─── Shared primary color classes ─────────────────────────────────────────────

const PRIMARY = {
  iconBg:    'bg-primary/10 border border-primary/20',
  iconText:  'text-primary',
  stripBg:   'bg-primary/5 border border-primary/20',
  countText: 'text-primary',
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  findings: Finding[];
  getFindingsByType: (type: FindingType) => Finding[];
  onGenerateTechnical: () => Promise<void>;
  onGenerateManagement: () => Promise<void>;
  onGenerateRetest: () => Promise<void>;
  onGenerateSast: () => Promise<void>;
  onGenerateSca: () => Promise<void>;
  onGenerateAsm: () => Promise<void>;
  onGenerateLlm: () => Promise<void>;
  onGenerateSecret: () => Promise<void>;
  onGenerateToip: () => Promise<void>;
  toipTestCaseCount: number;
};

// ─── ReportCard ───────────────────────────────────────────────────────────────

type ReportCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  badgeLabel: string;
  badgeCount: number | string;
  buttonLabel: string;
  disabled?: boolean;
  comingSoon?: boolean;
  onClick: () => void;
};

function ReportCard({
  icon, title, description,
  badgeLabel, badgeCount,
  buttonLabel, disabled = false, comingSoon = false, onClick,
}: ReportCardProps) {
  const c = PRIMARY;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex min-w-0 flex-wrap items-start gap-2">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${c.iconBg}`}>
            <span className={c.iconText}>{icon}</span>
          </div>
          <span className="min-w-0 flex-1 leading-tight">{title}</span>
          {comingSoon && (
            <span className="ml-auto shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border/40 tracking-wide">
              SOON
            </span>
          )}
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 flex-1 justify-between">
        {/* Finding count strip */}
        <div className={`flex flex-col gap-1.5 p-3 rounded-lg border sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 ${c.stripBg}`}>
          <span className="text-xs text-muted-foreground">{badgeLabel}:</span>
          <span className={`text-sm font-bold tabular-nums ${c.countText}`}>{badgeCount}</span>
          <span className="text-xs text-muted-foreground">
            {typeof badgeCount === 'number' ? 'findings detected' : 'test cases'}
          </span>
        </div>

        <Button
          variant="outline"
          className="w-full"
          disabled={disabled}
          onClick={onClick}
        >
          <Download className="h-4 w-4 mr-2" />
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="flex-1 h-px bg-border/50" />
        {title}
        <span className="flex-1 h-px bg-border/50" />
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportsTab({
  findings, getFindingsByType,
  onGenerateTechnical, onGenerateManagement, onGenerateRetest,
  onGenerateSast, onGenerateSca, onGenerateAsm, onGenerateLlm,
  onGenerateSecret, onGenerateToip, toipTestCaseCount,
}: Props) {
  const pentestCount  = getFindingsByType('pentest').length;
  const sastCount     = getFindingsByType('sast').length;
  const asmCount      = getFindingsByType('asm').length;
  const llmCount      = getFindingsByType('llm').length;
  const secretCount   = getFindingsByType('secret').length;
  const fixedCount    = findings.filter(f => f.retest_status === 'Fixed').length;
  const notFixedCount = findings.filter(f => f.retest_status === 'Not Fixed').length;
  const openCount     = findings.filter(f => !f.retest_status || f.retest_status === 'Open').length;

  return (
    <div className="space-y-8">

      {/* ── Pentest Reports ── */}
      <Section title="Pentest Reports">
        <ReportCard
          icon={<FileText className="h-4 w-4" />}
          title="Technical Report"
          description="Full technical findings with CVSS scores, steps to reproduce, affected components, and detailed remediation guidance for the security team."
          badgeLabel="Pentest findings"
          badgeCount={pentestCount}
          buttonLabel="Generate Technical Report"
          disabled={pentestCount === 0}
          onClick={onGenerateTechnical}
        />
        <ReportCard
          icon={<FileText className="h-4 w-4" />}
          title="Management Report"
          description="Executive summary with risk ratings, business impact, and high-level remediation recommendations — designed for non-technical stakeholders and C-suite."
          badgeLabel="Pentest findings"
          badgeCount={pentestCount}
          buttonLabel="Generate Management Report"
          disabled={pentestCount === 0}
          onClick={onGenerateManagement}
        />
      </Section>

      {/* ── Remediation ── */}
      <Section title="Remediation">
        <Card className="flex flex-col md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex min-w-0 flex-wrap items-start gap-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${PRIMARY.iconBg}`}>
                <RefreshCw className={`h-4 w-4 ${PRIMARY.iconText}`} />
              </div>
              <span className="min-w-0 leading-tight">Retest Report</span>
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Full remediation progress report — shows which findings are fixed, still open, or failed retest, with timeline and tester attribution.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            {/* Stat strip */}
            <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-xl font-bold tabular-nums text-green-400">{fixedCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Fixed</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xl font-bold tabular-nums text-red-400">{notFixedCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Not Fixed</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/40 border border-border/40">
                <p className="text-xl font-bold tabular-nums text-muted-foreground">{openCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              disabled={findings.length === 0}
              onClick={onGenerateRetest}
            >
              <Download className="h-4 w-4 mr-2" />
              Generate Retest Report
            </Button>
          </CardContent>
        </Card>
      </Section>

      {/* ── Code Analysis ── */}
      <Section title="Code Analysis">
        <ReportCard
          icon={<SastReportIcon className="h-4 w-4" />}
          title="SAST Report"
          description="Static Application Security Testing — code-level vulnerability report with file paths, line numbers, tool attribution, and CWE mappings."
          badgeLabel="SAST findings"
          badgeCount={sastCount}
          buttonLabel="Generate SAST Report"
          disabled={sastCount === 0}
          onClick={onGenerateSast}
        />
        <ReportCard
          icon={<SCA_LUCIDE_ICON className="h-4 w-4" />}
          title="SCA Report"
          description="Software Composition Analysis — open-source dependency vulnerabilities, outdated packages, CVE mappings, and license compliance issues."
          badgeLabel="SCA findings"
          badgeCount={sastCount}
          buttonLabel="Generate SCA Report"
          disabled={sastCount === 0}
          onClick={onGenerateSca}
        />
      </Section>

      {/* ── Secrets detection (same Word template as SAST/ASM/LLM technical reports) ── */}
      <Section title="Secrets Detection">
        <div className="md:col-span-2">
          <ReportCard
            icon={<SecretReportIcon className="h-4 w-4" />}
            title="Secret Detection Report"
            description="Credential and secret scanning — exposed API keys, tokens, certificates, passwords in code and configuration, with remediation guidance aligned to your secret findings."
            badgeLabel="Secret findings"
            badgeCount={secretCount}
            buttonLabel="Generate Secret Report"
            disabled={secretCount === 0}
            onClick={onGenerateSecret}
          />
        </div>
      </Section>

      {/* ── Attack Surface ── */}
      <Section title="Attack Surface">
        <ReportCard
          icon={<AsmReportIcon className="h-4 w-4" />}
          title="ASM Report"
          description="Attack Surface Management — exposed assets, open ports, service enumeration, cloud misconfigurations, and external attack surface overview."
          badgeLabel="ASM findings"
          badgeCount={asmCount}
          buttonLabel="Generate ASM Report"
          disabled={asmCount === 0}
          onClick={onGenerateAsm}
        />
        <ReportCard
          icon={<TOIP_LUCIDE_ICON className="h-4 w-4" />}
          title="TOIP Report"
          description="Technieum OffSec Intelligence Portal — exports all test cases with Assessment Result: Secure, Not Secure, or N/A when not yet marked. Grouped by category in a Word document."
          badgeLabel="Test cases"
          badgeCount={`${toipTestCaseCount}`}
          buttonLabel="Generate TOIP Report"
          disabled={toipTestCaseCount === 0}
          onClick={onGenerateToip}
        />
      </Section>

      {/* ── AI Security ── */}
      <Section title="AI Security">
        <ReportCard
          icon={<LlmReportIcon className="h-4 w-4" />}
          title="LLM Security Report"
          description="AI/LLM-specific vulnerability assessment — prompt injection, jailbreaks, data exfiltration, excessive agency, RAG poisoning, and model abuse vectors."
          badgeLabel="LLM findings"
          badgeCount={llmCount}
          buttonLabel="Generate LLM Report"
          disabled={llmCount === 0}
          onClick={onGenerateLlm}
        />

        {/* Placeholder card to keep the grid balanced */}
        <Card className="flex flex-col border-dashed border-border/30 bg-secondary/10">
          <CardContent className="flex flex-col items-center justify-center flex-1 py-10 gap-2 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/50 font-medium">More reports coming soon</p>
            <p className="text-xs text-muted-foreground/40">
              Additional AI security report formats are in development.
            </p>
          </CardContent>
        </Card>
      </Section>

    </div>
  );
}