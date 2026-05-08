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

type CourseQuizSummaryItem = {
  index: number;
  question: string;
  selectedIndex: number | null | undefined;
  options: [string, string, string, string];
  correctIndex: number;
  isCorrect: boolean;
};

type BuildCourseQuizSummaryDocxInput = {
  topicName: string;
  scoreCorrect: number;
  scoreTotal: number;
  correctItems: CourseQuizSummaryItem[];
  incorrectItems: CourseQuizSummaryItem[];
};

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
    children: labels.map((label) =>
      makeCell([new Paragraph({ children: [new TextRun({ text: label, bold: true, color: 'f97316' })] })]),
    ),
  });

const dataRow = (...values: string[]) =>
  new TableRow({
    children: values.map((value) => makeCell([new Paragraph({ children: [new TextRun(value)] })])),
  });

function buildQuestionRows(items: CourseQuizSummaryItem[]): TableRow[] {
  if (!items.length) {
    return [
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'No records in this section.', italics: true, color: '6b7280' })],
              }),
            ],
          }),
        ],
      }),
    ];
  }

  return items.map((item) => {
    const pickedText =
      item.selectedIndex !== null && item.selectedIndex !== undefined && item.selectedIndex >= 0
        ? item.options[item.selectedIndex] || 'Not answered'
        : 'Not answered';
    return dataRow(
      `Q${item.index + 1}. ${item.question}`,
      pickedText,
      item.options[item.correctIndex],
      item.isCorrect ? 'Correct' : 'Incorrect',
    );
  });
}

export async function createCourseQuizSummaryDocxBlob(
  input: BuildCourseQuizSummaryDocxInput,
): Promise<Blob> {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const percent = input.scoreTotal > 0 ? Math.round((100 * input.scoreCorrect) / input.scoreTotal) : 0;

  const summaryRows: TableRow[] = [
    headerRow('Metric', 'Value'),
    dataRow('Course topic', input.topicName),
    dataRow('Score', `${input.scoreCorrect} / ${input.scoreTotal}`),
    dataRow('Percentage', `${percent}%`),
    dataRow('Correct answers', String(input.correctItems.length)),
    dataRow('Incorrect / skipped answers', String(input.incorrectItems.length)),
  ];

  const questionHeader = headerRow('Question', 'Your answer', 'Correct answer', 'Status');

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [new TextRun({ text: 'TECHNIEUM', bold: true, size: 48, color: 'f97316' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: 'COURSE QUIZ SUMMARY REPORT', bold: true, size: 32 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: input.topicName, bold: true, size: 28 })],
    }),
    metaLine('Report generated', currentDate),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun('')] }),

    sectionHeading('Summary'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: summaryRows,
    }),

    sectionHeading(`Correct answers (${input.correctItems.length})`),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: [questionHeader, ...buildQuestionRows(input.correctItems)],
    }),

    sectionHeading(`Incorrect answers (${input.incorrectItems.length})`),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: [questionHeader, ...buildQuestionRows(input.incorrectItems)],
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
          text: 'This report lists detailed course quiz responses, including correct and incorrect answers.',
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
