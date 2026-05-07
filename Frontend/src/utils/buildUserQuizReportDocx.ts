import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { UserQuizReportResponse } from '@/api/quizAttempts';

function makeCell(children: Paragraph[]) {
  return new TableCell({
    children,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
  });
}

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 2, color: 'f97316' },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: 'f97316' },
  left: { style: BorderStyle.SINGLE, size: 2, color: 'f97316' },
  right: { style: BorderStyle.SINGLE, size: 2, color: 'f97316' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '334155' },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '334155' },
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function quizLabel(t: string): string {
  return t === 'product_mcq' ? 'Product quiz' : 'Course quiz';
}

/**
 * Build a .docx blob for the admin/manager “user quiz report” download.
 */
export async function createUserQuizReportDocxBlob(data: UserQuizReportResponse): Promise<Blob> {
  const u = data.user;
  const s = data.summary;
  const displayName = u.fullName?.trim() || u.name;
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const sectionHeading = (text: string) =>
    new Paragraph({
      spacing: { before: 300, after: 120 },
      children: [new TextRun({ text, bold: true, size: 28, color: 'f97316' })],
    });

  const metaLine = (label: string, value: string) =>
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `${label}: `, bold: true, color: 'f97316' }),
        new TextRun({ text: value }),
      ],
    });

  const headerRow = (...labels: string[]) =>
    new TableRow({
      tableHeader: true,
      children: labels.map((l) =>
        makeCell([new Paragraph({ children: [new TextRun({ text: l, bold: true, color: 'f97316' })] })])
      ),
    });

  const dataRow = (...values: string[]) =>
    new TableRow({
      children: values.map((v) => makeCell([new Paragraph({ children: [new TextRun(v)] })])),
    });

  const summaryRows: TableRow[] = [
    headerRow('Metric', 'Value'),
    dataRow('Product quiz completions', String(s.productQuizAttempts)),
    dataRow('Course quiz completions', String(s.courseQuizAttempts)),
    dataRow(
      'Average score — product quizzes (%)',
      s.productAvgPercent != null ? String(s.productAvgPercent) : '—'
    ),
    dataRow(
      'Average score — course quizzes (%)',
      s.courseAvgPercent != null ? String(s.courseAvgPercent) : '—'
    ),
  ];

  const attemptHeader = headerRow('Completed', 'Type', 'Product / course', 'Score', '% correct');

  const attemptDataRows: TableRow[] =
    data.attempts.length === 0
      ? [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 5,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'No product or course quiz attempts recorded for this user.',
                        italics: true,
                        color: '6b7280',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ]
      : data.attempts.map((a) => {
          const pct =
            a.scoreTotal > 0 ? String(Math.round((1000 * a.scoreCorrect) / a.scoreTotal) / 10) : '0';
          const subjectLabel = (a.subjectName && String(a.subjectName).trim()) || a.subjectSlug;
          return dataRow(
            formatWhen(a.completedAt),
            quizLabel(a.quizType),
            subjectLabel,
            `${a.scoreCorrect} / ${a.scoreTotal}`,
            `${pct}%`
          );
        });

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [new TextRun({ text: 'TECHNIEUM', bold: true, size: 48, color: 'f97316' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: 'QUIZ COMPLETION REPORT', bold: true, size: 32 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: displayName, bold: true, size: 28 })],
    }),
    metaLine('Report generated', currentDate),
    metaLine('Username', u.name),
    metaLine('Email', u.email),
    metaLine('Role', (u.role || '—').toString()),
    metaLine('Member since', formatWhen(u.createdAt)),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun('')] }),

    sectionHeading('Summary'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: summaryRows,
    }),

    sectionHeading(`All attempts (${data.attempts.length})`),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: [attemptHeader, ...attemptDataRows],
    }),

    new Paragraph({ spacing: { before: 400 }, children: [new TextRun('')] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Technieum UpSkill portal', bold: true, color: 'f97316' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'This report lists product MCQ and course topic quiz completions as stored in the system.',
          size: 18,
          color: '6b7280',
        }),
      ],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
