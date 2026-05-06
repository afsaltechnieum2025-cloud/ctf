/** TOIP (OffSec Intelligence Portal) test case — same shape in Findings UI and Word report */

export type ToipStatus = 'Secure' | 'Not Secure' | null;

export type ToipTestCase = {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: ToipStatus;
};

export const TOIP_TEST_CASE_TEMPLATES: Omit<ToipTestCase, 'id' | 'status'>[] = [
  { category: 'Authentication & Session', title: 'Brute Force Protection', description: 'Verify account lockout after repeated failed login attempts and CAPTCHA enforcement.', severity: 'High' },
  { category: 'Authentication & Session', title: 'Session Fixation', description: 'Ensure session tokens are regenerated after successful authentication.', severity: 'High' },
  { category: 'Authentication & Session', title: 'Credential Exposure in Transit', description: 'Confirm all authentication requests are made over HTTPS with no credential leakage.', severity: 'Critical' },
  { category: 'Authentication & Session', title: 'MFA Bypass', description: 'Test for multi-factor authentication bypass using parameter tampering or response manipulation.', severity: 'Critical' },
  { category: 'Authentication & Session', title: 'Weak Password Policy', description: 'Verify enforcement of strong password requirements (length, complexity, history).', severity: 'Medium' },

  { category: 'Injection', title: 'SQL Injection', description: 'Test all input vectors for SQL injection vulnerabilities including error-based, blind, and time-based.', severity: 'Critical' },
  { category: 'Injection', title: 'Command Injection', description: 'Check for OS command injection in file operations, URL parameters, and form fields.', severity: 'Critical' },
  { category: 'Injection', title: 'LDAP Injection', description: 'Test LDAP queries for injection if directory services are in use.', severity: 'High' },
  { category: 'Injection', title: 'Template Injection (SSTI)', description: 'Identify server-side template injection in rendered views and email templates.', severity: 'High' },
  { category: 'Injection', title: 'XPath Injection', description: 'Validate XML/XPATH queries against injection if XML data stores are used.', severity: 'Medium' },

  { category: 'XSS & Client-Side', title: 'Reflected XSS', description: 'Test URL parameters, headers, and form fields for reflected cross-site scripting.', severity: 'High' },
  { category: 'XSS & Client-Side', title: 'Stored XSS', description: 'Verify that all user-supplied content stored in the database is properly sanitized on output.', severity: 'Critical' },
  { category: 'XSS & Client-Side', title: 'DOM-Based XSS', description: 'Review client-side JavaScript for unsafe DOM manipulation using user-controlled data.', severity: 'High' },
  { category: 'XSS & Client-Side', title: 'Content Security Policy', description: 'Confirm a strict CSP header is present and prevents inline script execution.', severity: 'Medium' },

  { category: 'Access Control', title: 'IDOR - Horizontal Privilege Escalation', description: 'Attempt to access other users\' resources by manipulating object identifiers.', severity: 'High' },
  { category: 'Access Control', title: 'Vertical Privilege Escalation', description: 'Test whether lower-privileged users can access admin or elevated functionality.', severity: 'Critical' },
  { category: 'Access Control', title: 'Forced Browsing', description: 'Attempt direct URL access to authenticated/restricted pages without proper session.', severity: 'High' },
  { category: 'Access Control', title: 'API Authorization Controls', description: 'Verify all API endpoints enforce authorization and are not accessible with invalid/missing tokens.', severity: 'High' },

  { category: 'Cryptography & Data Exposure', title: 'Sensitive Data in Responses', description: 'Review API and page responses for PII, credentials, tokens, or internal paths.', severity: 'High' },
  { category: 'Cryptography & Data Exposure', title: 'Insecure Direct Object References in Files', description: 'Test file download endpoints for path traversal and unauthorized file access.', severity: 'High' },
  { category: 'Cryptography & Data Exposure', title: 'Weak TLS Configuration', description: 'Verify TLS version, cipher suite strength, and certificate validity.', severity: 'Medium' },
  { category: 'Cryptography & Data Exposure', title: 'Sensitive Data in Local Storage', description: 'Check browser storage (localStorage, sessionStorage, cookies) for sensitive tokens or PII.', severity: 'Medium' },

  { category: 'Business Logic', title: 'Price/Quantity Manipulation', description: 'Test e-commerce flows for negative values, zero-price bypass, or quantity overflow.', severity: 'High' },
  { category: 'Business Logic', title: 'Workflow Bypass', description: 'Attempt to skip required steps in multi-step processes (checkout, approval, verification).', severity: 'High' },
  { category: 'Business Logic', title: 'Race Condition', description: 'Test concurrent requests on critical operations (transfers, coupon redemption, votes).', severity: 'Medium' },

  { category: 'Infrastructure', title: 'Security Headers', description: 'Validate presence of HSTS, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy headers.', severity: 'Low' },
  { category: 'Infrastructure', title: 'CORS Misconfiguration', description: 'Test CORS policy for overly permissive origins and credential inclusion.', severity: 'High' },
  { category: 'Infrastructure', title: 'Server Information Disclosure', description: 'Check for version banners, stack traces, and directory listings in error responses.', severity: 'Low' },
  { category: 'Infrastructure', title: 'Open Redirect', description: 'Test redirect parameters for open redirect to external malicious domains.', severity: 'Medium' },
];

export function createInitialToipTestCases(): ToipTestCase[] {
  return TOIP_TEST_CASE_TEMPLATES.map((tc, i) => ({ ...tc, id: `toip-${i}`, status: null }));
}
