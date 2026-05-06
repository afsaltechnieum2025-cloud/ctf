import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Packer,
  PageBreak,
  ImageRun,
  Header,
} from 'docx';
import { saveAs } from 'file-saver';
import { Project, Finding } from '@/types';

// Fetch image and convert to base64
const fetchImageAsBase64 = async (url: string): Promise<{ data: Uint8Array; width: number; height: number } | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Calculate dimensions to fit within page width (max 500px width, maintain aspect ratio)
          const maxWidth = 500;
          const maxHeight = 350;
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          // Convert base64 to Uint8Array for browser compatibility
          const base64Data = (reader.result as string).split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          resolve({
            data: bytes,
            width: Math.round(width),
            height: Math.round(height),
          });
        };
        img.onerror = () => resolve(null);
        img.src = reader.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const createHeading = (text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) => {
  return new Paragraph({
    heading: level,
    children: [
      new TextRun({
        text: text,
        bold: true,
        color: 'E85D04',
      }),
    ],
    spacing: { before: 400, after: 200 },
  });
};

const createSectionTitle = (text: string) => {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 28,
        color: 'E85D04',
      }),
    ],
    spacing: { before: 400, after: 200 },
  });
};

const createParagraph = (text: string, options?: { bold?: boolean; size?: number }) => {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        bold: options?.bold,
        size: options?.size || 22,
      }),
    ],
    spacing: { after: 100 },
  });
};

const createTableCell = (
  text: string,
  options?: { bold?: boolean; shading?: string; widthPercent?: number; align?: typeof AlignmentType[keyof typeof AlignmentType] },
) => {
  return new TableCell({
    children: [new Paragraph({
      alignment: options?.align,
      children: [new TextRun({ text, bold: options?.bold, size: 20 })],
    })],
    shading: options?.shading ? { fill: options.shading } : undefined,
    width: { size: options?.widthPercent ?? 50, type: WidthType.PERCENTAGE },
  });
};

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    critical: 'DC2F02',
    high: 'E85D04',
    medium: 'F48C06',
    low: '38B000',
    info: '0096C7',
  };
  return colors[severity] || '666666';
};

// ─── Dynamic helpers based on report type ────────────────────────────────────

const getAssessmentType = (reportSuffix: string): string => {
  const map: Record<string, string> = {
    Technical:  'Web Application Penetration Testing',
    SAST:       'Static Application Security Testing (SAST)',
    SCA:        'Software Composition Analysis (SCA)',
    ASM:        'Attack Surface Management (ASM)',
    LLM:        'AI / LLM Security Assessment',
    Secret:     'Secret Detection & Exposed Credentials',
    Retest:     'Retest / Remediation Verification',
  };
  return map[reportSuffix] ?? `${reportSuffix} Security Assessment`;
};

const getReportSubtitle = (reportSuffix: string): string => {
  const map: Record<string, string> = {
    Technical:  'SECURITY ASSESSMENT REPORT',
    SAST:       'STATIC APPLICATION SECURITY TESTING REPORT',
    SCA:        'SOFTWARE COMPOSITION ANALYSIS REPORT',
    ASM:        'ATTACK SURFACE MANAGEMENT REPORT',
    LLM:        'AI / LLM SECURITY ASSESSMENT REPORT',
    Secret:     'SECRET DETECTION & CREDENTIALS REPORT',
    Retest:     'RETEST SUMMARY REPORT',
  };
  return map[reportSuffix] ?? `${reportSuffix.toUpperCase()} SECURITY REPORT`;
};

const getHeaderLabel = (reportSuffix: string): string => {
  const map: Record<string, string> = {
    Technical:  'TECHNIEUM SECURITY ASSESSMENT',
    SAST:       'TECHNIEUM SAST ASSESSMENT',
    SCA:        'TECHNIEUM SCA ASSESSMENT',
    ASM:        'TECHNIEUM ATTACK SURFACE ASSESSMENT',
    LLM:        'TECHNIEUM AI / LLM ASSESSMENT',
    Secret:     'TECHNIEUM SECRET DETECTION ASSESSMENT',
    Retest:     'TECHNIEUM RETEST SUMMARY',
  };
  return map[reportSuffix] ?? 'TECHNIEUM SECURITY ASSESSMENT';
};

const getIntroText = (reportSuffix: string, targetDomain: string): string => {
  const map: Record<string, string> = {
    Technical: `A comprehensive web application penetration test was conducted on ${targetDomain} following OWASP Testing Guide, PTES, and NIST guidelines to identify vulnerabilities and security weaknesses.`,
    SAST:      `A Static Application Security Testing (SAST) assessment was conducted on ${targetDomain} to identify code-level vulnerabilities, insecure coding patterns, CWE-mapped weaknesses, and security anti-patterns across the codebase.`,
    SCA:       `A Software Composition Analysis (SCA) assessment was conducted on ${targetDomain} to identify vulnerable open-source dependencies, outdated packages, CVE-mapped library risks, and license compliance issues.`,
    ASM:       `An Attack Surface Management (ASM) assessment was conducted on ${targetDomain} to enumerate exposed assets, open ports, running services, cloud misconfigurations, and external attack surface vectors.`,
    LLM:       `An AI/LLM Security Assessment was conducted on ${targetDomain} to identify prompt injection risks, jailbreak vectors, data exfiltration scenarios, excessive agency issues, RAG poisoning, and model abuse attack surfaces.`,
    Secret:    `A secret detection assessment was conducted on ${targetDomain} to identify exposed credentials, API keys, tokens, certificates, and other sensitive material in repositories, configuration, CI/CD artifacts, and related assets.`,
  };
  return map[reportSuffix] ?? `A ${reportSuffix} security assessment was conducted on ${targetDomain} to identify vulnerabilities and security weaknesses.`;
};

// ─── Main Technical / Specialist Report Generator ────────────────────────────

export const generateTechnicalReport = async (
  project: Project,
  projectFindings: Finding[],
  pocImages?: Record<string, string[]>,
  securityAnalysts?: string[],
  reportSuffix = 'Technical',
) => {
  const criticalCount = projectFindings.filter(f => f.severity === 'critical').length;
  const highCount    = projectFindings.filter(f => f.severity === 'high').length;
  const mediumCount  = projectFindings.filter(f => f.severity === 'medium').length;
  const lowCount     = projectFindings.filter(f => f.severity === 'low').length;

  const codeTokens = (project.name || project.targetDomain || 'PR')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  const projectCode = codeTokens.length <= 1
    ? (codeTokens[0]?.slice(0, 2).toUpperCase() || 'PR')
    : codeTokens.map(part => part[0]?.toUpperCase()).join('').slice(0, 3);

  // ── Dynamic labels ──
  const assessmentType = getAssessmentType(reportSuffix);
  const reportSubtitle = getReportSubtitle(reportSuffix);
  const headerLabel    = getHeaderLabel(reportSuffix);
  const introText      = getIntroText(reportSuffix, project.targetDomain);

  // Fetch logo for report header
  const logoUrl  = `${window.location.origin}/technieum-logo.png`;
  const logoData = await fetchImageAsBase64(logoUrl);

  const findingSections: (Paragraph | Table)[] = [];
  
  for (const [index, finding] of projectFindings.entries()) {
    const findingRef = `${projectCode}${String(index + 1).padStart(3, '0')}`;
    const findingPocs = pocImages?.[finding.id] || finding.evidence || [];
    const imageElements: (Paragraph | Table)[] = [];
    
    if (findingPocs.length > 0) {
      imageElements.push(
        new Paragraph({
          children: [new TextRun({ text: 'Proof of Concept (Evidence):', bold: true, size: 22, color: 'E85D04' })],
          spacing: { before: 150, after: 100 },
        })
      );
      
      for (let i = 0; i < findingPocs.length; i++) {
        const pocUrl   = findingPocs[i];
        const imageData = await fetchImageAsBase64(pocUrl);
        
        if (imageData) {
          imageElements.push(
            new Paragraph({
              children: [new TextRun({ text: `Evidence ${i + 1}:`, size: 20, italics: true })],
              spacing: { before: 100, after: 50 },
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageData.data,
                  transformation: { width: imageData.width, height: imageData.height },
                  type: 'png',
                }),
              ],
              spacing: { after: 150 },
            })
          );
        } else {
          imageElements.push(
            new Paragraph({
              children: [
                new TextRun({ text: `[Evidence ${i + 1}: Image could not be loaded]`, size: 20, italics: true, color: '999999' }),
              ],
              spacing: { after: 100 },
            })
          );
        }
      }
    }

    findingSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${findingRef}: ${finding.title}`,
            bold: true,
            size: 26,
            color: getSeverityColor(finding.severity),
          }),
        ],
        spacing: { before: 120, after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Severity: ', bold: true, size: 22 }),
          new TextRun({ text: finding.severity.toUpperCase(), size: 22, color: getSeverityColor(finding.severity) }),
          new TextRun({ text: '    CVSS Score: ', bold: true, size: 22 }),
          new TextRun({ text: String(finding.cvssScore || 'N/A'), size: 22 }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Affected Assets: ', bold: true, size: 22 }),
          new TextRun({ text: finding.affectedAssets.join(', '), size: 22 }),
        ],
        spacing: { after: 150 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Description:', bold: true, size: 22, color: 'E85D04' })],
        spacing: { before: 100, after: 50 },
      }),
      new Paragraph({
        children: [new TextRun({ text: finding.description, size: 22 })],
        spacing: { after: 150 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Steps to Reproduce:', bold: true, size: 22, color: 'E85D04' })],
        spacing: { before: 100, after: 50 },
      }),
      new Paragraph({
        children: [new TextRun({ text: finding.stepsToReproduce, size: 22 })],
        spacing: { after: 150 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Impact:', bold: true, size: 22, color: 'E85D04' })],
        spacing: { before: 100, after: 50 },
      }),
      new Paragraph({
        children: [new TextRun({ text: finding.impact, size: 22 })],
        spacing: { after: 150 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Remediation:', bold: true, size: 22, color: 'E85D04' })],
        spacing: { before: 100, after: 50 },
      }),
      new Paragraph({
        children: [new TextRun({ text: finding.remediation, size: 22 })],
        spacing: { after: 150 },
      }),
      ...imageElements,
      new Paragraph({
        children: [new TextRun({ text: '─'.repeat(80), color: 'DDDDDD' })],
        spacing: { before: 80, after: 80 },
      }),
    );
  }

  // ── Header (all pages) ──
  const headerChildren = logoData ? [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          data: logoData.data,
          transformation: {
            width: 120,
            height: Math.round(120 * (logoData.height / logoData.width)),
          },
          type: 'png',
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: headerLabel, bold: true, size: 18, color: 'E85D04' }),
      ],
      spacing: { after: 220 },
    }),
  ] : [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: headerLabel, bold: true, size: 18, color: 'E85D04' }),
      ],
      spacing: { after: 220 },
    }),
  ];

  const analystDisplay = securityAnalysts && securityAnalysts.length > 0
    ? securityAnalysts.join(', ')
    : 'Not Assigned';

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1800, right: 1440, bottom: 1440, left: 1440,
              header: 900, footer: 720,
            },
          },
        },
        headers: {
          default: new Header({ children: headerChildren }),
        },
        children: [
          // ── Title Page ──
          ...(logoData ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: logoData.data,
                  transformation: {
                    width: 180,
                    height: Math.round(180 * (logoData.height / logoData.width)),
                  },
                  type: 'png',
                }),
              ],
              spacing: { before: 400, after: 200 },
            }),
          ] : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'TECHNIEUM', bold: true, size: 56, color: 'E85D04' }),
            ],
            spacing: { before: logoData ? 100 : 800, after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: reportSubtitle, bold: true, size: 36, color: 'FAA307' }),
            ],
            spacing: { after: 600 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: project.targetDomain, size: 28, bold: true }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Document Classification: CONFIDENTIAL', size: 22, italics: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Assessment Date: ${formatDate(project.startDate)} - ${formatDate(project.endDate)}`,
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `Report Date: ${formatDate(new Date())}`, size: 22 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Report Version: 1.0', size: 22 }),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Lead Assessor: Robert Aaron', size: 22 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `Security Analyst: ${analystDisplay}`, size: 22 }),
            ],
            spacing: { after: 600 },
          }),
          new Paragraph({ children: [new PageBreak()] }),

          // ── 1. Document Control ──
          createSectionTitle('1. DOCUMENT CONTROL'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell('Document Title',   { bold: true, shading: 'F5F5F5' }),
                  createTableCell('Penetration Testing Report'),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Target',           { bold: true, shading: 'F5F5F5' }),
                  createTableCell(project.targetDomain),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Target IP',        { bold: true, shading: 'F5F5F5' }),
                  createTableCell(project.targetIPs.join(', ')),
                ],
              }),
              new TableRow({
                children: [
                  // ✅ Dynamic assessment type
                  createTableCell('Assessment Type',  { bold: true, shading: 'F5F5F5' }),
                  createTableCell(assessmentType),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Classification',   { bold: true, shading: 'F5F5F5' }),
                  createTableCell('Confidential'),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Date',             { bold: true, shading: 'F5F5F5' }),
                  createTableCell(formatDate(new Date())),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Lead Assessor',    { bold: true, shading: 'F5F5F5' }),
                  createTableCell('Robert Aaron'),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Security Analyst', { bold: true, shading: 'F5F5F5' }),
                  createTableCell(analystDisplay),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Prepared By',      { bold: true, shading: 'F5F5F5' }),
                  createTableCell('Technieum Security Assessment Services'),
                ],
              }),
            ],
          }),

          // ── 2. Executive Summary ──
          createSectionTitle('2. EXECUTIVE SUMMARY'),
          // ✅ Dynamic intro paragraph
          createParagraph(introText),
          new Paragraph({
            children: [new TextRun({ text: 'Key Findings Summary:', bold: true, size: 24 })],
            spacing: { before: 200, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell('Severity', { bold: true, shading: 'E85D04', align: AlignmentType.CENTER }),
                  createTableCell('Count',    { bold: true, shading: 'E85D04', align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Critical', { shading: 'FEE2E2', align: AlignmentType.CENTER }),
                  createTableCell(String(criticalCount), { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('High',     { shading: 'FFEDD5', align: AlignmentType.CENTER }),
                  createTableCell(String(highCount), { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Medium',   { shading: 'FEF3C7', align: AlignmentType.CENTER }),
                  createTableCell(String(mediumCount), { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Low',      { shading: 'DCFCE7', align: AlignmentType.CENTER }),
                  createTableCell(String(lowCount), { align: AlignmentType.CENTER }),
                ],
              }),
            ],
          }),

          // ── 3. Summary of Findings ──
          createSectionTitle('3. SUMMARY OF FINDINGS'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell('ID',             { bold: true, shading: 'E85D04', widthPercent: 12 }),
                  createTableCell('Title',          { bold: true, shading: 'E85D04', widthPercent: 38 }),
                  createTableCell('Severity',       { bold: true, shading: 'E85D04', widthPercent: 15 }),
                  createTableCell('Affected Assets',{ bold: true, shading: 'E85D04', widthPercent: 35 }),
                ],
              }),
              ...projectFindings.map((f, index) => new TableRow({
                children: [
                  createTableCell(`${projectCode}${String(index + 1).padStart(3, '0')}`, { widthPercent: 12 }),
                  createTableCell(f.title, { widthPercent: 38 }),
                  createTableCell(f.severity.toUpperCase(), { widthPercent: 15 }),
                  createTableCell(f.affectedAssets.slice(0, 2).join(', '), { widthPercent: 35 }),
                ],
              })),
            ],
          }),

          // ── 4. Detailed Findings ──
          createSectionTitle('4. DETAILED FINDINGS'),
          ...findingSections,

          // ── 5. Remediation Roadmap ──
          createSectionTitle('5. REMEDIATION ROADMAP'),
          new Paragraph({
            children: [new TextRun({ text: 'IMMEDIATE (0-7 Days):', bold: true, size: 24, color: 'DC2F02' })],
            spacing: { before: 100, after: 50 },
          }),
          createParagraph('• Address all Critical severity findings immediately'),
          createParagraph('• Focus on authentication and authorization controls'),
          new Paragraph({
            children: [new TextRun({ text: 'SHORT-TERM (7-30 Days):', bold: true, size: 24, color: 'E85D04' })],
            spacing: { before: 200, after: 50 },
          }),
          createParagraph('• Remediate all High severity findings'),
          createParagraph('• Implement security headers and input validation'),
          new Paragraph({
            children: [new TextRun({ text: 'MEDIUM-TERM (30-90 Days):', bold: true, size: 24, color: 'F48C06' })],
            spacing: { before: 200, after: 50 },
          }),
          createParagraph('• Address Medium and Low severity findings'),
          createParagraph('• Conduct security training for development team'),

          // ── 6. Conclusion ──
          createSectionTitle('6. CONCLUSION'),
          createParagraph(
            `The ${assessmentType} identified ${projectFindings.length} security vulnerabilities across the ${project.targetDomain} platform. Immediate action is required to address the ${criticalCount} critical findings that pose significant risk to the organization.`
          ),

          // ── Footer ──
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '─'.repeat(60), color: 'CCCCCC' })],
            spacing: { before: 600 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'CONFIDENTIAL - Technieum Security Assessment Services', italics: true, size: 20 }),
            ],
            spacing: { before: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Prepared by: Robert Aaron${analystDisplay !== 'Not Assigned' ? ` & ${analystDisplay}` : ''} | Date: ${formatDate(new Date())}`,
                italics: true,
                size: 20,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${project.targetDomain}_${reportSuffix}_Report.docx`);
};

// ─── Management Report ────────────────────────────────────────────────────────

export const generateManagementReport = async (project: Project, projectFindings: Finding[]) => {
  const criticalCount = projectFindings.filter(f => f.severity === 'critical').length;
  const highCount     = projectFindings.filter(f => f.severity === 'high').length;
  const mediumCount   = projectFindings.filter(f => f.severity === 'medium').length;
  const lowCount      = projectFindings.filter(f => f.severity === 'low').length;
  const totalFindings = projectFindings.length;

  const riskLevel = criticalCount > 10 ? 'CRITICAL' : criticalCount > 5 ? 'HIGH RISK' : highCount > 5 ? 'MODERATE RISK' : 'LOW RISK';

  const logoUrl  = `${window.location.origin}/technieum-logo.png`;
  const logoData = await fetchImageAsBase64(logoUrl);

  const headerChildren = logoData ? [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          data: logoData.data,
          transformation: {
            width: 120,
            height: Math.round(120 * (logoData.height / logoData.width)),
          },
          type: 'png',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'TECHNIEUM EXECUTIVE SUMMARY', bold: true, size: 18, color: 'E85D04' }),
      ],
      spacing: { after: 220 },
    }),
  ] : [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'TECHNIEUM EXECUTIVE SUMMARY', bold: true, size: 18, color: 'E85D04' }),
      ],
      spacing: { after: 220 },
    }),
  ];

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({ children: headerChildren }),
        },
        children: [
          // Title Page
          ...(logoData ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: logoData.data,
                  transformation: {
                    width: 180,
                    height: Math.round(180 * (logoData.height / logoData.width)),
                  },
                  type: 'png',
                }),
              ],
              spacing: { before: 400, after: 200 },
            }),
          ] : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'TECHNIEUM', bold: true, size: 56, color: 'E85D04' })],
            spacing: { before: logoData ? 100 : 800, after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'EXECUTIVE SECURITY SUMMARY', bold: true, size: 36, color: 'FAA307' })],
            spacing: { after: 600 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Client: ${project.client}`, size: 28 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Target: ${project.targetDomain}`, size: 28, bold: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Assessment Period: ${formatDate(project.startDate)} - ${formatDate(project.endDate)}`,
                size: 22,
              }),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph({ children: [new PageBreak()] }),

          createSectionTitle('OVERALL SECURITY POSTURE'),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: riskLevel,
                bold: true,
                size: 44,
                color: criticalCount > 5 ? 'DC2F02' : highCount > 5 ? 'E85D04' : '38B000',
              }),
            ],
            spacing: { before: 200, after: 400 },
          }),

          createSectionTitle('KEY FINDINGS SUMMARY'),
          createParagraph(`Our security assessment identified ${totalFindings} vulnerabilities:`),
          new Paragraph({
            children: [
              new TextRun({ text: '• CRITICAL: ', bold: true, size: 24, color: 'DC2F02' }),
              new TextRun({ text: `${criticalCount} issues requiring immediate attention`, size: 22 }),
            ],
            spacing: { before: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• HIGH: ', bold: true, size: 24, color: 'E85D04' }),
              new TextRun({ text: `${highCount} significant security weaknesses`, size: 22 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• MEDIUM: ', bold: true, size: 24, color: 'F48C06' }),
              new TextRun({ text: `${mediumCount} moderate concerns`, size: 22 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '• LOW: ', bold: true, size: 24, color: '38B000' }),
              new TextRun({ text: `${lowCount} minor issues`, size: 22 }),
            ],
            spacing: { after: 300 },
          }),

          createSectionTitle('BUSINESS IMPACT ASSESSMENT'),
          ...(criticalCount > 0 ? [
            new Paragraph({
              children: [new TextRun({ text: '1. FINANCIAL RISK', bold: true, size: 24 })],
              spacing: { before: 100, after: 50 },
            }),
            createParagraph('Attackers could potentially manipulate pricing, create fraudulent listings, and conduct financial fraud at scale.'),
            new Paragraph({
              children: [new TextRun({ text: '2. DATA BREACH RISK', bold: true, size: 24 })],
              spacing: { before: 200, after: 50 },
            }),
            createParagraph('Complete user database exposure including personal information and financial records. This creates significant privacy compliance violations.'),
            new Paragraph({
              children: [new TextRun({ text: '3. REPUTATIONAL DAMAGE', bold: true, size: 24 })],
              spacing: { before: 200, after: 50 },
            }),
            createParagraph('Public disclosure of vulnerabilities could severely damage customer trust and lead to business impact.'),
            new Paragraph({
              children: [new TextRun({ text: '4. LEGAL LIABILITY', bold: true, size: 24 })],
              spacing: { before: 200, after: 50 },
            }),
            createParagraph('Failure to implement basic security controls violates industry standards and creates legal exposure.'),
          ] : [
            createParagraph('The identified issues pose moderate risk to business operations.'),
          ]),

          createSectionTitle('RECOMMENDED ACTIONS'),
          new Paragraph({
            children: [new TextRun({ text: 'IMMEDIATE PRIORITIES (This Week):', bold: true, size: 24, color: 'DC2F02' })],
            spacing: { before: 200, after: 50 },
          }),
          createParagraph('• Implement authentication on all API endpoints'),
          createParagraph('• Add authorization checks for sensitive operations'),
          createParagraph('• Enable security logging and monitoring'),
          new Paragraph({
            children: [new TextRun({ text: 'SHORT-TERM (Next 30 Days):', bold: true, size: 24, color: 'E85D04' })],
            spacing: { before: 200, after: 50 },
          }),
          createParagraph('• Deploy Web Application Firewall (WAF)'),
          createParagraph('• Implement rate limiting across all endpoints'),
          createParagraph('• Conduct security training for development team'),
          new Paragraph({
            children: [new TextRun({ text: 'LONG-TERM (Next Quarter):', bold: true, size: 24, color: 'F48C06' })],
            spacing: { before: 200, after: 50 },
          }),
          createParagraph('• Establish secure development lifecycle'),
          createParagraph('• Regular penetration testing schedule'),
          createParagraph('• Security awareness program for all staff'),

          createSectionTitle('INVESTMENT RECOMMENDATION'),
          createParagraph('Based on our assessment, we recommend prioritizing security investments to address the identified vulnerabilities. The cost of remediation is significantly lower than the potential costs of a security breach.'),
          new Paragraph({
            children: [
              new TextRun({
                text: 'For technical details, please refer to the full Technical Report.',
                italics: true,
                size: 22,
              }),
            ],
            spacing: { before: 300, after: 400 },
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '─'.repeat(60), color: 'CCCCCC' })],
            spacing: { before: 400 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'CONFIDENTIAL - Technieum Security Assessment Services', italics: true, size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Prepared for: ${project.client} | Date: ${formatDate(new Date())}`,
                italics: true,
                size: 20,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${project.targetDomain}_Management_Summary.docx`);
};

// ─── Retest Report ────────────────────────────────────────────────────────────

interface RetestFinding {
  id: string;
  title: string;
  severity: string;
  status: string;
  retest_status: string | null;
  retest_date: string | null;
}

export const generateRetestReport = async (
  project: Project,
  projectFindings: RetestFinding[]
) => {
  const fixedCount    = projectFindings.filter(f => f.retest_status === 'Fixed').length;
  const notFixedCount = projectFindings.filter(f => f.retest_status === 'Not Fixed').length;
  const openCount     = projectFindings.filter(f => f.retest_status === 'Open' || !f.retest_status).length;
  const totalFindings = projectFindings.length;
  const remediationRate = totalFindings > 0 ? Math.round((fixedCount / totalFindings) * 100) : 0;

  const logoUrl  = `${window.location.origin}/technieum-logo.png`;
  const logoData = await fetchImageAsBase64(logoUrl);

  const headerChildren = logoData ? [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          data: logoData.data,
          transformation: {
            width: 120,
            height: Math.round(120 * (logoData.height / logoData.width)),
          },
          type: 'png',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'TECHNIEUM RETEST SUMMARY', bold: true, size: 18, color: 'E85D04' }),
      ],
      spacing: { after: 100 },
    }),
  ] : [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'TECHNIEUM RETEST SUMMARY', bold: true, size: 18, color: 'E85D04' }),
      ],
      spacing: { after: 100 },
    }),
  ];

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({ children: headerChildren }),
        },
        children: [
          // Title Page
          ...(logoData ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: logoData.data,
                  transformation: {
                    width: 180,
                    height: Math.round(180 * (logoData.height / logoData.width)),
                  },
                  type: 'png',
                }),
              ],
              spacing: { before: 400, after: 200 },
            }),
          ] : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'TECHNIEUM', bold: true, size: 56, color: 'E85D04' })],
            spacing: { before: logoData ? 100 : 800, after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'RETEST SUMMARY REPORT', bold: true, size: 36, color: 'FAA307' })],
            spacing: { after: 600 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Client: ${project.client}`, size: 28 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Target: ${project.targetDomain}`, size: 28, bold: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Report Date: ${formatDate(new Date())}`, size: 22 })],
            spacing: { after: 400 },
          }),
          new Paragraph({ children: [new PageBreak()] }),

          createSectionTitle('REMEDIATION SUMMARY'),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${remediationRate}%`,
                bold: true,
                size: 56,
                color: remediationRate >= 80 ? '38B000' : remediationRate >= 50 ? 'F48C06' : 'DC2F02',
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'REMEDIATION RATE', bold: true, size: 24, color: '666666' }),
            ],
            spacing: { after: 400 },
          }),

          createSectionTitle('RETEST STATUS BREAKDOWN'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell('Status',     { bold: true, shading: 'E85D04' }),
                  createTableCell('Count',      { bold: true, shading: 'E85D04' }),
                  createTableCell('Percentage', { bold: true, shading: 'E85D04' }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Fixed',                { shading: 'DCFCE7' }),
                  createTableCell(String(fixedCount)),
                  createTableCell(`${totalFindings > 0 ? Math.round((fixedCount / totalFindings) * 100) : 0}%`),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Not Fixed',            { shading: 'FEE2E2' }),
                  createTableCell(String(notFixedCount)),
                  createTableCell(`${totalFindings > 0 ? Math.round((notFixedCount / totalFindings) * 100) : 0}%`),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Open (Not Retested)', { shading: 'FEF3C7' }),
                  createTableCell(String(openCount)),
                  createTableCell(`${totalFindings > 0 ? Math.round((openCount / totalFindings) * 100) : 0}%`),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Total',               { bold: true, shading: 'F5F5F5' }),
                  createTableCell(String(totalFindings), { bold: true }),
                  createTableCell('100%',                { bold: true }),
                ],
              }),
            ],
          }),

          createSectionTitle('FINDINGS BY SEVERITY'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell('Severity',      { bold: true, shading: 'E85D04' }),
                  createTableCell('Title',         { bold: true, shading: 'E85D04' }),
                  createTableCell('Retest Status', { bold: true, shading: 'E85D04' }),
                ],
              }),
              ...projectFindings.map(f => new TableRow({
                children: [
                  createTableCell(f.severity.toUpperCase()),
                  createTableCell(f.title),
                  createTableCell(f.retest_status || 'Not Retested'),
                ],
              })),
            ],
          }),

          createSectionTitle('CONCLUSION'),
          createParagraph(
            fixedCount === totalFindings
              ? `All ${totalFindings} findings have been successfully remediated. The target application now demonstrates improved security posture.`
              : notFixedCount > 0
                ? `Of the ${totalFindings} findings identified, ${fixedCount} have been fixed, ${notFixedCount} remain unresolved, and ${openCount} are pending retest. Immediate attention is required for unresolved findings.`
                : `Of the ${totalFindings} findings identified, ${fixedCount} have been fixed and ${openCount} are pending retest verification.`
          ),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '─'.repeat(60), color: 'CCCCCC' })],
            spacing: { before: 400 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'CONFIDENTIAL - Technieum Security Assessment Services', italics: true, size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Prepared for: ${project.client} | Date: ${formatDate(new Date())}`,
                italics: true,
                size: 20,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${project.targetDomain}_Retest_Report.docx`);
};

// ─── TOIP (OffSec Intelligence Portal) report — test case list with Secure / Not Secure / N/A ───

export type ToipReportCase = {
  category: string;
  title: string;
  description: string;
  severity: string;
  status: 'Secure' | 'Not Secure' | null;
};

const toipResultLabel = (status: ToipReportCase['status']): string => {
  if (status === 'Secure') return 'Secure';
  if (status === 'Not Secure') return 'Not Secure';
  return 'N/A';
};

export const generateToipReport = async (
  project: Project,
  cases: ToipReportCase[],
  securityAnalysts?: string[],
) => {
  const secureCount = cases.filter(c => c.status === 'Secure').length;
  const notSecureCount = cases.filter(c => c.status === 'Not Secure').length;
  const naCount = cases.filter(c => c.status !== 'Secure' && c.status !== 'Not Secure').length;
  const total = cases.length;

  const logoUrl = `${window.location.origin}/technieum-logo.png`;
  const logoData = await fetchImageAsBase64(logoUrl);

  const analystDisplay = securityAnalysts && securityAnalysts.length > 0
    ? securityAnalysts.join(', ')
    : 'Not Assigned';

  const headerLabel = 'TECHNIEUM OFFSEC INTELLIGENCE PORTAL (TOIP)';
  const reportSubtitle = 'OFFSEC INTELLIGENCE PORTAL (TOIP) REPORT';

  const headerChildren = logoData
    ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: logoData.data,
              transformation: {
                width: 120,
                height: Math.round(120 * (logoData.height / logoData.width)),
              },
              type: 'png',
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: headerLabel, bold: true, size: 18, color: 'E85D04' })],
          spacing: { after: 220 },
        }),
      ]
    : [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: headerLabel, bold: true, size: 18, color: 'E85D04' })],
          spacing: { after: 220 },
        }),
      ];

  const byCategory: Record<string, ToipReportCase[]> = {};
  for (const c of cases) {
    const k = c.category || 'Uncategorized';
    if (!byCategory[k]) byCategory[k] = [];
    byCategory[k].push(c);
  }
  const sortedCategories = Object.keys(byCategory).sort();

  const inventoryBlocks: (Paragraph | Table)[] = [];
  let rowNum = 0;
  for (const cat of sortedCategories) {
    inventoryBlocks.push(
      new Paragraph({
        children: [new TextRun({ text: cat, bold: true, size: 26, color: 'E85D04' })],
        spacing: { before: 320, after: 160 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createTableCell('#', { bold: true, shading: 'E85D04', widthPercent: 6, align: AlignmentType.CENTER }),
              createTableCell('Title', { bold: true, shading: 'E85D04', widthPercent: 22 }),
              createTableCell('Description', { bold: true, shading: 'E85D04', widthPercent: 38 }),
              createTableCell('Severity', { bold: true, shading: 'E85D04', widthPercent: 12, align: AlignmentType.CENTER }),
              createTableCell('Assessment Result', { bold: true, shading: 'E85D04', widthPercent: 22, align: AlignmentType.CENTER }),
            ],
          }),
          ...byCategory[cat].map(tc => {
            rowNum += 1;
            return new TableRow({
              children: [
                createTableCell(String(rowNum), { widthPercent: 6, align: AlignmentType.CENTER }),
                createTableCell(tc.title, { widthPercent: 22 }),
                createTableCell(tc.description || '—', { widthPercent: 38 }),
                createTableCell(String(tc.severity || '').toUpperCase(), { widthPercent: 12, align: AlignmentType.CENTER }),
                createTableCell(toipResultLabel(tc.status), { widthPercent: 22, align: AlignmentType.CENTER }),
              ],
            });
          }),
        ],
      }),
    );
  }

  const safeFileBase = (project.targetDomain || project.name || 'Project').replace(/[^\w.-]+/g, '_');

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1800, right: 1440, bottom: 1440, left: 1440, header: 900, footer: 720 },
          },
        },
        headers: { default: new Header({ children: headerChildren }) },
        children: [
          ...(logoData
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new ImageRun({
                      data: logoData.data,
                      transformation: {
                        width: 180,
                        height: Math.round(180 * (logoData.height / logoData.width)),
                      },
                      type: 'png',
                    }),
                  ],
                  spacing: { before: 400, after: 200 },
                }),
              ]
            : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'TECHNIEUM', bold: true, size: 56, color: 'E85D04' })],
            spacing: { before: logoData ? 100 : 800, after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: reportSubtitle, bold: true, size: 32, color: 'FAA307' })],
            spacing: { after: 400 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: project.targetDomain, size: 28, bold: true })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Document Classification: CONFIDENTIAL', size: 22, italics: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Assessment Date: ${formatDate(project.startDate)} - ${formatDate(project.endDate)}`,
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Report Date: ${formatDate(new Date())}`, size: 22 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Report Version: 1.0', size: 22 })],
            spacing: { after: 400 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Lead Assessor: Robert Aaron', size: 22 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Security Analyst: ${analystDisplay}`, size: 22 })],
            spacing: { after: 600 },
          }),
          new Paragraph({ children: [new PageBreak()] }),

          createSectionTitle('1. DOCUMENT CONTROL'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell('Document Title', { bold: true, shading: 'F5F5F5' }),
                  createTableCell('TOIP — OffSec Intelligence Portal Test Case Report'),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Target', { bold: true, shading: 'F5F5F5' }),
                  createTableCell(project.targetDomain),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Target IP', { bold: true, shading: 'F5F5F5' }),
                  createTableCell(project.targetIPs.join(', ') || '—'),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Assessment Type', { bold: true, shading: 'F5F5F5' }),
                  createTableCell('Technieum OffSec Intelligence Portal (TOIP) — Structured test cases'),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Classification', { bold: true, shading: 'F5F5F5' }),
                  createTableCell('Confidential'),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Date', { bold: true, shading: 'F5F5F5' }),
                  createTableCell(formatDate(new Date())),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Security Analyst', { bold: true, shading: 'F5F5F5' }),
                  createTableCell(analystDisplay),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Prepared By', { bold: true, shading: 'F5F5F5' }),
                  createTableCell('Technieum Security Assessment Services'),
                ],
              }),
            ],
          }),

          createSectionTitle('2. EXECUTIVE SUMMARY'),
          createParagraph(
            `This report documents ${total} TOIP security test cases for ${project.targetDomain}. Each case is recorded with severity and an assessment result: Secure, Not Secure, or N/A when not yet evaluated.`,
          ),
          new Paragraph({
            children: [new TextRun({ text: 'Results Summary:', bold: true, size: 24 })],
            spacing: { before: 200, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell('Result', { bold: true, shading: 'E85D04', align: AlignmentType.CENTER }),
                  createTableCell('Count', { bold: true, shading: 'E85D04', align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Secure', { shading: 'FEF9C3', align: AlignmentType.CENTER }),
                  createTableCell(String(secureCount), { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Not Secure', { shading: 'FFEDD5', align: AlignmentType.CENTER }),
                  createTableCell(String(notSecureCount), { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('N/A (not assessed)', { shading: 'F3F4F6', align: AlignmentType.CENTER }),
                  createTableCell(String(naCount), { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell('Total test cases', { bold: true, shading: 'F5F5F5', align: AlignmentType.CENTER }),
                  createTableCell(String(total), { bold: true, align: AlignmentType.CENTER }),
                ],
              }),
            ],
          }),

          createSectionTitle('3. TEST CASE INVENTORY (BY CATEGORY)'),
          createParagraph(
            'The following tables list every test case. Assessment Result reflects the current status in the portal: Secure, Not Secure, or N/A if neither option was selected.',
          ),
          ...inventoryBlocks,

          createSectionTitle('4. CONCLUSION'),
          createParagraph(
            total === 0
              ? 'No test cases were included in this report.'
              : `Of ${total} test cases, ${secureCount} were marked Secure, ${notSecureCount} Not Secure, and ${naCount} remain N/A pending assessment.`,
          ),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '─'.repeat(60), color: 'CCCCCC' })],
            spacing: { before: 600 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'CONFIDENTIAL - Technieum Security Assessment Services', italics: true, size: 20 }),
            ],
            spacing: { before: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Prepared by: Robert Aaron${analystDisplay !== 'Not Assigned' ? ` & ${analystDisplay}` : ''} | Date: ${formatDate(new Date())}`,
                italics: true,
                size: 20,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${safeFileBase}_TOIP_Report.docx`);
};