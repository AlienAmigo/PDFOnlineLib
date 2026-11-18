import { siteConfig } from '../config';

export interface PdfEntry {
  id: string;
  title: string;
  description: string;
  fileName: string;
}

const entries: PdfEntry[] = [
  {
    id: 'sample',
    title: 'Пример документа',
    description: 'Тестовый PDF для проверки просмотра',
    fileName: 'sample.pdf',
  },
];

export const pdfList: (PdfEntry & { url: string })[] = entries.map((entry) => ({
  ...entry,
  url: siteConfig.paths.pdf(entry.fileName),
}));

export function getPdfById(id: string) {
  return pdfList.find((entry) => entry.id === id);
}
