import { siteConfig } from '../config';

export interface PdfEntry {
  id: string;
  index: string;
  title: string;
  description: string;
  fileName: string;
}

const entries: PdfEntry[] = [
  {
    id: 'aaaof9wrix',
    index: '',
    title: 'Пример документа',
    description: 'Тестовый PDF для проверки просмотра',
    fileName: 'sample.pdf',
  },
  {
    id: 'pokc80qren',
    index: '26-0005',
    title: 'Miles - Lancet Infectious Diseases',
    description:
      '«Real-world effectiveness of 20‑valent pneumococcal conjugate vaccine against all-cause outcomes among Medicare beneficiaries aged 65 years and older in the USA: a retrospective cohort study» (Miles et al., Infectious Diseases, April 30, 2026)',
    fileName:
      '26-0005 - Miles - Lancet Infectious Diseases_2026.07.06_LowRes.pdf',
  },
];

export const pdfList: (PdfEntry & { url: string })[] = entries.map((entry) => ({
  ...entry,
  url: siteConfig.paths.pdf(entry.fileName),
}));

export function getPdfById(id: string) {
  return pdfList.find((entry) => entry.id === id);
}
