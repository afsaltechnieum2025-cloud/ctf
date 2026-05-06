// ─── Types ────────────────────────────────────────────────────────────────────

export type FindingType = 'pentest' | 'sast' | 'asm' | 'llm' | 'secret';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
export type RetestStatus = 'Open' | 'Fixed' | 'Not Fixed';
export type CLType = 'web' | 'api' | 'cloud' | 'aiLlm';
export type AppRole = 'admin' | 'manager' | 'tester' | 'client';

export type Project = {
  id: string; name: string; client: string;
  description: string | null;
  domain: string | null; ip_addresses: string[] | null;
  status: string | null; start_date: string | null; end_date: string | null;
  created_at: string;
  findings_count?: number; critical_count?: number; high_count?: number;
  medium_count?: number; low_count?: number; info_count?: number; assignees_count?: number;
  project_code?: string;
  scope: string | null;
  test_credentials: string | null;
  business_logic?: string | null;
  entry_points?: string | null;
  auth_controls?: string | null;
  tech_stack?: string | null;
};

export type Finding = {
  id: string; title: string; description: string | null; severity: string | number;
  cvss_score: number | null; status: string | null; created_at: string; created_by: string;
  steps_to_reproduce: string | null; impact: string | null; remediation: string | null;
  affected_component: string | null; cwe_id: string | null;
  retest_status: string | null; retest_date: string | null;
  retest_notes: string | null; retested_by: string | null;
  finding_type: string | null;
  file_path?: string | null;
  line_number?: number | null;
  tool_name?: string | null;
  asset_type?: string | null;
  port?: number | null;
  protocol?: string | null;
  llm_category?: string | null;
  prompt_example?: string | null;
};

export type FindingPoc = {
  id: string; finding_id: string; file_path: string;
  file_name: string; uploaded_by: string; uploaded_at: string;
};

export type Assignee = {
  id: string; user_id: string; username: string; assigned_at: string; role?: AppRole | null;
};

export type ChecklistRow = {
  id: string; project_id: string; checklist_type: string;
  category: string; item_key: string; is_checked: boolean;
  updated_by: string | null; updated_at: string | null;
};

export type ArchComponentType =
  | 'firewall'
  | 'vpn'
  | 'dns'
  | 'cdn'
  | 'loadbalancer'
  | 'frontend'
  | 'mobile'
  | 'auth'
  | 'api'
  | 'server'
  | 'database'
  | 'cloud'
  | 'monitoring'
  | 'email'
  | 'external';

export type ArchComponent = {
  id: string;
  name: string;
  type: ArchComponentType;
  ip?: string;
  port?: string;
  tech?: string;
  notes?: string;
  connections: string[];
};

export type ArchUpload = { name: string; preview: string; notes: string; };