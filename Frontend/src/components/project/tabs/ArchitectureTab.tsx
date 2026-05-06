// Changes from original:
// 1. Accepts `projectId` prop
// 2. Drops local components/setComponents — uses useArchComponents hook
// 3. handleGenerate → calls bulkSave after parse
// 4. addComponent / saveEdit / deleteComp → call hook methods
// 5. Shows a status indicator (saving/loading)

import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown, FileText, FolderOpen, Layers,
  Map, Pencil, Plus, Table2, Trash2, Upload,
} from 'lucide-react';
import type { ArchComponent } from '@/utils/projectTypes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { YellowAccentBlock, OrangeAccentBlock, SectionHeading } from '@/components/project/accent-blocks';
import { useParams } from 'react-router-dom';
import { useArchComponents } from '@/hooks/useArchComponents';

// ── Types ─────────────────────────────────────────────────────────────────────

type ComponentType =
  | 'firewall' | 'vpn' | 'dns' | 'cdn' | 'loadbalancer'
  | 'frontend' | 'mobile' | 'auth' | 'api' | 'server'
  | 'database' | 'cloud' | 'monitoring' | 'email' | 'external';

interface CompFormValues {
  name: string; type: ComponentType;
  ip: string; port: string; tech: string; notes: string;
}

interface Props {
  projectId: string;                          // 👈 NEW — pass from parent
  stage: 'upload' | 'map';
  setStage: (s: 'upload' | 'map') => void;
  companyName: string; setCompanyName: (v: string) => void;
  summary: string;    setSummary:     (v: string) => void;
}

// ── Static data (unchanged) ───────────────────────────────────────────────────

const TYPE_META: Record<ComponentType, { label: string; icon: string }> = {
  firewall:     { label: 'Firewall',      icon: '🔥' },
  vpn:          { label: 'VPN',           icon: '🔒' },
  dns:          { label: 'DNS',           icon: '📡' },
  cdn:          { label: 'CDN',           icon: '🌐' },
  loadbalancer: { label: 'Load Balancer', icon: '⚖️' },
  frontend:     { label: 'Frontend',      icon: '🖥️' },
  mobile:       { label: 'Mobile',        icon: '📱' },
  auth:         { label: 'Auth / IAM',    icon: '🔐' },
  api:          { label: 'API / Gateway', icon: '🔌' },
  server:       { label: 'Server',        icon: '⚙️' },
  database:     { label: 'Database',      icon: '🗄️' },
  cloud:        { label: 'Cloud',         icon: '☁️' },
  monitoring:   { label: 'Monitoring',    icon: '📊' },
  email:        { label: 'Email',         icon: '📧' },
  external:     { label: 'External',      icon: '🌍' },
};

const LAYER_ORDER: ComponentType[] = [
  'firewall','vpn','dns','cdn','loadbalancer',
  'frontend','mobile','auth','api','server',
  'database','cloud','monitoring','email','external',
];

const KEYWORDS: Record<ComponentType, string[]> = {
  firewall:     ['firewall','sonicwall','palo alto','fortinet','checkpoint','asa','pfsense','watchguard','waf'],
  vpn:          ['vpn','openvpn','wireguard','ipsec','ssl vpn','zscaler','tunnel'],
  dns:          ['dns','route53','cloudflare dns','azure dns','bind'],
  cdn:          ['cdn','cloudfront','akamai','fastly','cloudflare','edge'],
  loadbalancer: ['load balancer','nginx','haproxy','f5','elb','alb','nlb','traefik'],
  frontend:     ['react','vue','angular','next.js','nextjs','nuxt','svelte','frontend','web app','spa','html','javascript','typescript','gatsby'],
  mobile:       ['mobile','ios','android','react native','flutter','swift','kotlin','xamarin','expo'],
  auth:         ['auth','oauth','saml','sso','ldap','active directory','azure ad','okta','keycloak','cognito','iam','identity','ping'],
  api:          ['api','rest','graphql','grpc','express','fastapi','django rest','spring boot','api gateway','gateway','microservice'],
  server:       ['server','node.js','nodejs','python','java','go','ruby','php','dotnet','.net','spring','flask','django','laravel','rails','tomcat','apache','iis','linux','windows server','ubuntu','centos','rhel','vmware','docker','kubernetes','k8s','container'],
  database:     ['database','mysql','postgres','postgresql','mongodb','redis','elasticsearch','cassandra','dynamodb','oracle','mssql','sql server','mariadb','sqlite','cosmos','firebase','supabase','db'],
  cloud:        ['aws','azure','gcp','google cloud','amazon','ec2','s3','lambda','azure blob','azure functions','heroku','digitalocean','vercel','netlify'],
  monitoring:   ['monitor','datadog','grafana','prometheus','splunk','elk','logstash','kibana','new relic','dynatrace','sentry','pagerduty','cloudwatch','logging'],
  email:        ['email','smtp','sendgrid','mailgun','ses','postmark','exchange','office 365','gmail','mail server'],
  external:     ['third-party','stripe','paypal','twilio','slack','salesforce','hubspot','jira','external api','webhook','integration'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectType(text: string): ComponentType {
  const t = text.toLowerCase();
  for (const [type, keys] of Object.entries(KEYWORDS) as [ComponentType, string[]][]) {
    if (keys.some(k => t.includes(k))) return type;
  }
  return 'server';
}

function parseTextFile(raw: string) {
  const lines = raw.split(/\n/).map(l => l.trim()).filter(Boolean);
  let companyName = '', summary = '';
  for (const line of lines.slice(0, 5)) {
    const m = line.match(/(?:client|company|org|organization)[:\s]+(.+)/i);
    if (m) { companyName = m[1].trim(); break; }
    if (!companyName && line.length < 60 && !line.includes(':')) companyName = line;
  }
  for (const line of lines.slice(0, 8)) {
    if (line.length > 30 && line.length < 200) { summary = line; break; }
  }
  const bigText = raw.replace(/[,;|•\-–]/g, '\n');
  const segments = bigText.split(/\n/).map(s => s.trim()).filter(s => s.length > 2);
  const components: ArchComponent[] = [];
  const seen = new Set<string>();
  const typeCount: Record<string, number> = {};
  for (const seg of segments) {
    const type = detectType(seg);
    typeCount[type] = (typeCount[type] || 0) + 1;
    if (typeCount[type] > 4) continue;
    let name = seg;
    const pm = seg.match(/\b([A-Z][a-zA-Z0-9.+#\s]{2,30})\b/);
    if (pm) name = pm[1].trim();
    if (name.length > 40) name = name.substring(0, 38) + '…';
    const key = `${type}:${name.toLowerCase()}`;
    if (!seen.has(key) && name.length > 2) {
      seen.add(key);
      const ipMatch   = seg.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
      const portMatch = seg.match(/(?:port[:\s]*)(\d{2,5})/i) || seg.match(/:(\d{2,5})\b/);
      components.push({
        id: crypto.randomUUID(), name, type, connections: [],
        ip: ipMatch?.[1] ?? '', port: portMatch?.[1] ?? '',
        tech: name, notes: seg.length < 120 ? seg : '',
      });
    }
  }
  return { companyName, summary, components: components.slice(0, 22) };
}

const inputSelectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

function CompForm({ value, onChange, onSave, onCancel, saveLabel = 'Save' }: {
  value: CompFormValues; onChange: (v: CompFormValues) => void;
  onSave: () => void; onCancel: () => void; saveLabel?: string;
}) {
  const fields: [keyof CompFormValues, string, string][] = [
    ['name', 'Name *', 'e.g. React App'],
    ['ip',   'IP / Hostname', 'e.g. 10.0.0.1'],
    ['port', 'Port(s)', 'e.g. 443'],
    ['tech', 'Technology', 'e.g. Nginx'],
    ['notes','Notes', 'Security notes'],
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(([k, label, ph]) => (
        <div key={k} className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
          <Input value={value[k] as string} onChange={e => onChange({ ...value, [k]: e.target.value })} placeholder={ph} />
        </div>
      ))}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</Label>
        <select value={value.type} onChange={e => onChange({ ...value, type: e.target.value as ComponentType })} className={inputSelectClass}>
          {(Object.entries(TYPE_META) as [ComponentType, { label: string; icon: string }][]).map(([v, m]) => (
            <option key={v} value={v}>{m.icon} {m.label}</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2 flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" className="gradient-technieum text-primary-foreground" onClick={onSave}>{saveLabel}</Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const EMPTY_FORM: CompFormValues = { name: '', type: 'server', ip: '', port: '', tech: '', notes: '' };

const SAMPLE_FORMAT = `Client: Acme Corp
Industry: FinTech

Network & Security:
- SonicWall Firewall
- Cisco VPN, port 1194
- Cloudflare CDN

Frontend: React web app
Mobile: React Native
Backend: Node.js / Express, port 3000
Database: PostgreSQL 10.0.1.10:5432, Redis
Cloud: AWS (EC2, S3, Lambda)
Auth: Okta SSO, Azure AD
Monitoring: Datadog, PagerDuty`;

export default function ArchitectureTab({
  projectId: projectIdProp,
  stage, setStage,
  companyName, setCompanyName,
  summary, setSummary,
}: Props) {
  // Fallback: read from URL if prop is missing/undefined
  const { id: urlId } = useParams<{ id: string }>();
  const projectId = (projectIdProp && projectIdProp !== 'undefined') ? projectIdProp : urlId ?? '';

  const {
    components,
    status, error, setError,
    bulkSave,
    addComponent: apiAdd,
    updateComponent: apiUpdate,
    deleteComponent: apiDelete,
  } = useArchComponents(projectId);  // 👈 all state + API calls here

  const didInitStageFromDb = useRef(false);
  useEffect(() => {
    if (status !== 'idle' || didInitStageFromDb.current) return;
    if (components.length > 0) {
      setStage('map');
      didInitStageFromDb.current = true;
    }
  }, [status, components.length, setStage]);

  const [fileContent, setFileContent] = useState('');
  const [fileName,    setFileName]    = useState('');
  const [parseError,  setParseError]  = useState('');
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editForm,    setEditForm]    = useState<CompFormValues>(EMPTY_FORM);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm,     setAddForm]     = useState<CompFormValues>(EMPTY_FORM);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [activeTab,   setActiveTab]   = useState<'map' | 'table'>('map');
  const [dragOver,    setDragOver]    = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.name.endsWith('.txt')) { setParseError('Please upload a .txt file.'); return; }
    setParseError(''); setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => setFileContent((e.target?.result as string) ?? '');
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (!fileContent.trim()) { setParseError('File is empty.'); return; }
    const result = parseTextFile(fileContent);
    if (!result.components.length) { setParseError('No components detected. Check your file format.'); return; }
    setCompanyName(result.companyName);
    setSummary(result.summary);
    await bulkSave(result.components);  // 👈 persist to DB
    setStage('map');
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleReupload = () => {
    didInitStageFromDb.current = true;
    setStage('upload'); setFileContent(''); setFileName(''); setParseError('');
    setShowAddForm(false); setEditingId(null);
  };

  const deleteComp = (id: string) => apiDelete(id);  // 👈 optimistic + DB

  const startEdit = (comp: ArchComponent) => {
    setEditingId(comp.id);
    setEditForm({ name: comp.name, type: comp.type as ComponentType, ip: comp.ip ?? '', port: comp.port ?? '', tech: comp.tech ?? '', notes: comp.notes ?? '' });
    setShowAddForm(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await apiUpdate(editingId, editForm);  // 👈 optimistic + DB
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    await apiAdd({ ...addForm, connections: [] });  // 👈 DB
    setAddForm(EMPTY_FORM);
    setShowAddForm(false);
  };

  const layerGroups = LAYER_ORDER.reduce<Record<string, ArchComponent[]>>((acc, layer) => {
    const comps = components.filter(c => c.type === layer);
    if (comps.length) acc[layer] = comps;
    return acc;
  }, {});

  // ── Status bar ─────────────────────────────────────────────────────────────
  const StatusBar = () => {
    if (status === 'loading') return (
      <p className="text-xs text-muted-foreground animate-pulse">⏳ Loading components…</p>
    );
    if (status === 'saving') return (
      <p className="text-xs text-primary animate-pulse">💾 Saving…</p>
    );
    if (error) return (
      <p className="text-xs text-destructive">⚠️ {error} <button className="underline ml-1" onClick={() => setError('')}>Dismiss</button></p>
    );
    return null;
  };

  // ── Upload screen ──────────────────────────────────────────────────────────
  if (stage === 'upload') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-md">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-lg">Architecture from Text File</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Upload a <code className="px-1.5 py-0.5 rounded-md bg-muted border border-border text-xs font-mono text-primary">.txt</code> file or paste details. The flow diagram builds automatically.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <SectionHeading icon={FileText}>Suggested file format</SectionHeading>
            <YellowAccentBlock>
              <pre className="text-xs sm:text-sm text-foreground/90 leading-relaxed m-0 whitespace-pre-wrap font-mono">{SAMPLE_FORMAT}</pre>
            </YellowAccentBlock>
          </div>
          <div
            role="button" tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={cn(
              'rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all sm:p-8',
              dragOver || fileName ? 'border-primary/50 bg-primary/10' : 'border-border bg-muted/20 hover:border-primary/30 hover:bg-muted/30',
            )}
          >
            <div className="flex justify-center mb-3">
              <div className={cn('h-12 w-12 rounded-full flex items-center justify-center', fileName ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground')}>
                <Upload className="h-6 w-6" />
              </div>
            </div>
            {fileName ? (
              <><p className="text-sm font-semibold text-primary">{fileName}</p><p className="text-xs text-muted-foreground mt-1">File ready — click Generate below</p></>
            ) : (
              <><p className="text-sm font-medium text-foreground">Drop your .txt file here</p><p className="text-xs text-muted-foreground mt-1">or click to browse</p></>
            )}
            <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          </div>
          <div>
            <SectionHeading icon={FileText}>Or paste text directly</SectionHeading>
            <Textarea value={fileContent} onChange={e => { setFileContent(e.target.value); setFileName(''); }} rows={6} placeholder="Paste your architecture description here…" className="font-mono text-sm min-h-[120px]" />
          </div>
          {parseError && <p className="text-sm text-destructive flex items-center gap-2"><span aria-hidden>⚠️</span> {parseError}</p>}
          <Button type="button" className="w-full gradient-technieum text-primary-foreground py-6 text-sm font-semibold" onClick={handleGenerate} disabled={!fileContent.trim() || status === 'saving'}>
            <Map className="h-4 w-4 mr-2 shrink-0" />
            {status === 'saving' ? 'Saving…' : 'Generate Architecture Diagram'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Map screen ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="min-w-0 space-y-1">
                {companyName && <CardTitle className="text-lg">{companyName}</CardTitle>}
                {summary && <CardDescription className="text-sm leading-relaxed max-w-xl">{summary}</CardDescription>}
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">{components.length} components · {Object.keys(layerGroups).length} layers</p>
                  <StatusBar />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button type="button" className="gradient-technieum text-primary-foreground" onClick={() => { setShowAddForm(v => !v); setEditingId(null); }}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Component
              </Button>
              <Button type="button" variant="outline" onClick={handleReupload}>Re-upload</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {LAYER_ORDER.map(layer => {
              const count = components.filter(c => c.type === layer).length;
              if (!count) return null;
              const m = TYPE_META[layer];
              return (
                <Badge key={layer} variant="secondary" className="font-normal border border-border bg-muted/50 text-muted-foreground">
                  <span className="mr-1">{m.icon}</span>{m.label}<span className="ml-1.5 font-semibold text-primary">{count}</span>
                </Badge>
              );
            })}
          </div>

          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'map' | 'table')}>
            <TabsList className="bg-secondary/50 h-auto w-full max-w-full justify-start gap-1 overflow-x-auto overscroll-x-contain p-1 flex-nowrap [-webkit-overflow-scrolling:touch] sm:w-fit sm:flex-wrap">
              <TabsTrigger value="map" className="shrink-0 gap-1.5 px-2.5 text-xs data-[state=active]:text-primary sm:px-3 sm:text-sm"><Map className="h-3.5 w-3.5 shrink-0" />Flow Map</TabsTrigger>
              <TabsTrigger value="table" className="shrink-0 gap-1.5 px-2.5 text-xs data-[state=active]:text-primary sm:px-3 sm:text-sm"><Table2 className="h-3.5 w-3.5 shrink-0" />Inventory</TabsTrigger>
            </TabsList>

            {showAddForm && (
              <OrangeAccentBlock className="mt-4">
                <p className="text-sm font-semibold text-foreground mb-4">New Component</p>
                <CompForm value={addForm} onChange={setAddForm} onSave={handleAdd} onCancel={() => { setShowAddForm(false); setAddForm(EMPTY_FORM); }} saveLabel="Add Component" />
              </OrangeAccentBlock>
            )}

            <TabsContent value="map" className="mt-4 space-y-4 outline-none">
              <SectionHeading icon={Layers}>Architecture Flow</SectionHeading>
              <div className="flex flex-col">
                {(Object.entries(layerGroups) as [ComponentType, ArchComponent[]][]).map(([layer, comps], idx) => {
                  const m = TYPE_META[layer];
                  return (
                    <div key={layer} className="flex flex-col items-center">
                      {idx > 0 && (
                        <div className="flex flex-col items-center py-1">
                          <div className="w-px h-3 bg-border" />
                          <ChevronDown className="h-4 w-4 text-primary/70 -mt-1" />
                        </div>
                      )}
                      <YellowAccentBlock className="w-full">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/20">
                          <span className="text-base">{m.icon}</span>
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">{m.label}</span>
                          <span className="text-xs text-muted-foreground">({comps.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {comps.map(comp =>
                            editingId === comp.id ? (
                              <div key={comp.id} className="w-full rounded-lg border border-primary/35 bg-card p-4">
                                <CompForm value={editForm} onChange={setEditForm} onSave={saveEdit} onCancel={() => setEditingId(null)} saveLabel="Save Changes" />
                              </div>
                            ) : (
                              <div
                                key={comp.id} role="button" tabIndex={0}
                                onClick={() => setSelectedId(selectedId === comp.id ? null : comp.id)}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(selectedId === comp.id ? null : comp.id); } }}
                                className={cn('relative min-w-[120px] max-w-[220px] rounded-lg border p-3 cursor-pointer transition-all', 'bg-secondary/50 hover:border-primary/40 hover:bg-primary/5', selectedId === comp.id && 'ring-2 ring-primary/40 border-primary/50 bg-primary/10')}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-foreground truncate">{comp.name}</p>
                                    {comp.tech && comp.tech !== comp.name && <p className="text-[11px] text-primary truncate mt-0.5">{comp.tech}</p>}
                                    {comp.ip && <p className="text-[10px] font-mono text-muted-foreground truncate mt-0.5">{comp.ip}{comp.port ? `:${comp.port}` : ''}</p>}
                                  </div>
                                  <div className="flex flex-col gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Edit" onClick={() => startEdit(comp)}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button type="button" variant="outline" size="icon" className="h-7 w-7 border-destructive/30 text-destructive hover:bg-destructive/10" title="Delete" onClick={() => deleteComp(comp.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                  </div>
                                </div>
                                {selectedId === comp.id && comp.notes && (
                                  <div className="mt-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground leading-relaxed">{comp.notes}</div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </YellowAccentBlock>
                    </div>
                  );
                })}
              </div>
              {!components.length && status !== 'loading' && (
                <YellowAccentBlock className="py-10" contentClassName="pl-4 pr-4 text-center">
                  <Map className="h-10 w-10 mx-auto mb-3 text-primary/80" />
                  <p className="text-sm font-semibold text-foreground/90 mb-1">No components yet</p>
                  <p className="text-xs text-muted-foreground">Add a component using the button above</p>
                </YellowAccentBlock>
              )}
              <p className="text-xs text-center text-muted-foreground">Click a component to view notes · edit or remove with the icons</p>
            </TabsContent>

            <TabsContent value="table" className="mt-4 outline-none">
              <YellowAccentBlock className={components.length ? 'p-0' : 'py-10'} contentClassName={components.length ? undefined : 'pl-4 pr-4 text-center'}>
                {components.length > 0 ? (
                  <div className="pl-3 pr-0 py-0 overflow-hidden rounded-r-lg">
                    <div className="overflow-x-auto py-1 pr-3">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-primary font-bold uppercase text-xs tracking-wider pl-4">Type</TableHead>
                            <TableHead className="text-primary font-bold uppercase text-xs tracking-wider">Name</TableHead>
                            <TableHead className="text-primary font-bold uppercase text-xs tracking-wider">Technology</TableHead>
                            <TableHead className="text-primary font-bold uppercase text-xs tracking-wider">IP / Host</TableHead>
                            <TableHead className="text-primary font-bold uppercase text-xs tracking-wider">Port(s)</TableHead>
                            <TableHead className="text-primary font-bold uppercase text-xs tracking-wider">Notes</TableHead>
                            <TableHead className="text-primary font-bold uppercase text-xs tracking-wider text-right pr-4">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {components.map(comp => {
                            const m = TYPE_META[comp.type as ComponentType] ?? TYPE_META.external;
                            return (
                              <TableRow key={comp.id} className="border-border/60">
                                <TableCell className="pl-4">
                                  <Badge variant="outline" className="font-normal border-primary/30 bg-primary/5 text-primary"><span className="mr-1">{m.icon}</span>{m.label}</Badge>
                                </TableCell>
                                <TableCell className="font-semibold text-foreground whitespace-nowrap">{comp.name}</TableCell>
                                <TableCell className="text-muted-foreground">{comp.tech || '—'}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{comp.ip || '—'}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{comp.port || '—'}</TableCell>
                                <TableCell className="text-muted-foreground max-w-[200px] truncate">{comp.notes || '—'}</TableCell>
                                <TableCell className="text-right pr-4">
                                  <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" size="sm" className="border-primary/35 bg-primary/5 text-primary hover:bg-primary/10" onClick={() => { startEdit(comp); setActiveTab('map'); }}>Edit</Button>
                                    <Button type="button" variant="outline" size="sm" className="border-destructive/35 text-destructive hover:bg-destructive/10" onClick={() => deleteComp(comp.id)}>Delete</Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <>
                    <Table2 className="h-10 w-10 mx-auto mb-3 text-primary/70" />
                    <p className="text-sm font-semibold text-foreground/90 mb-1">No components yet</p>
                    <p className="text-xs text-muted-foreground">Generate from a file or add manually</p>
                  </>
                )}
              </YellowAccentBlock>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}