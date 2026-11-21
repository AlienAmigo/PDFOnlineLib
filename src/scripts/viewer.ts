import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { reachGoal } from './metrics';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const SCALE_STEP = 0.25;
const SCALE_MIN = 0.5;
const SCALE_MAX = 3;
const WRAP_PADDING = 32;

export async function initViewer(container: HTMLElement): Promise<void> {
  const url = container.dataset.url;
  if (!url) return;

  const title = container.dataset.title ?? 'Документ';

  const canvas = container.querySelector<HTMLCanvasElement>(
    '[data-role="canvas"]',
  );
  const canvasWrap = container.querySelector<HTMLElement>(
    '[data-role="canvas-wrap"]',
  );
  const status = container.querySelector<HTMLElement>('[data-role="status"]');
  const pageInput = container.querySelector<HTMLInputElement>(
    '[data-role="page-input"]',
  );
  const pageTotal = container.querySelector<HTMLElement>(
    '[data-role="page-total"]',
  );
  const scaleInfo = container.querySelector<HTMLElement>('[data-role="scale"]');
  const infoModal = container.querySelector<HTMLElement>('[data-role="modal"]');
  const infoContent = container.querySelector<HTMLElement>(
    '[data-role="info-content"]',
  );
  const modalBackdrop = container.querySelector<HTMLElement>(
    '[data-role="modal-backdrop"]',
  );
  const modalClose = container.querySelector<HTMLButtonElement>(
    '[data-action="modal-close"]',
  );
  const infoBtn = container.querySelector<HTMLButtonElement>(
    '[data-action="info"]',
  );
  const actualSizeBtn = container.querySelector<HTMLButtonElement>(
    '[data-action="actual-size"]',
  );
  const downloadLink = container.querySelector<HTMLAnchorElement>(
    '[data-action="download"]',
  );
  const prevBtn = container.querySelector<HTMLButtonElement>(
    '[data-action="prev"]',
  );
  const nextBtn = container.querySelector<HTMLButtonElement>(
    '[data-action="next"]',
  );
  const zoomInBtn = container.querySelector<HTMLButtonElement>(
    '[data-action="zoom-in"]',
  );
  const zoomOutBtn = container.querySelector<HTMLButtonElement>(
    '[data-action="zoom-out"]',
  );
  const fitWidthBtn = container.querySelector<HTMLButtonElement>(
    '[data-action="fit-width"]',
  );
  const fitHeightBtn = container.querySelector<HTMLButtonElement>(
    '[data-action="fit-height"]',
  );
  const fullscreenBtn = container.querySelector<HTMLButtonElement>(
    '[data-action="fullscreen"]',
  );
  const fullscreenEnterIcon = container.querySelector<SVGSVGElement>(
    '[data-role="fullscreen-enter"]',
  );
  const fullscreenExitIcon = container.querySelector<SVGSVGElement>(
    '[data-role="fullscreen-exit"]',
  );

  if (
    !canvas ||
    !canvasWrap ||
    !status ||
    !pageInput ||
    !pageTotal ||
    !scaleInfo ||
    !infoModal ||
    !infoContent
  )
    return;

  let doc: pdfjsLib.PDFDocumentProxy;
  try {
    doc = await pdfjsLib.getDocument(url).promise;
  } catch {
    status.textContent = 'Не удалось загрузить документ.';
    return;
  }

  const canvasEl: HTMLCanvasElement = canvas;
  const canvasWrapEl: HTMLElement = canvasWrap;
  const statusEl: HTMLElement = status;
  const pageInputEl: HTMLInputElement = pageInput;
  const pageTotalEl: HTMLElement = pageTotal;
  const scaleInfoEl: HTMLElement = scaleInfo;
  const infoModalEl: HTMLElement = infoModal;
  const infoContentEl: HTMLElement = infoContent;

  const description = container.dataset.description ?? '';
  const fileName = container.dataset.filename ?? '';
  const documentId = container.dataset.document ?? fileName;

  let pageNumber = 1;
  let scale = 1.25;
  let rendering = false;
  let pendingRender = false;
  let viewCounted = false;

  const totalPages = doc.numPages;
  pageInputEl.max = String(totalPages);

  function updateControls(): void {
    pageInputEl.value = String(pageNumber);
    pageTotalEl.textContent = `/ ${totalPages}`;
    scaleInfoEl.textContent = `${Math.round(scale * 100)}%`;
    canvasEl.setAttribute(
      'aria-label',
      `${title} — страница ${pageNumber} из ${totalPages}`,
    );
    if (prevBtn) prevBtn.disabled = pageNumber <= 1;
    if (nextBtn) nextBtn.disabled = pageNumber >= totalPages;
    if (zoomOutBtn) zoomOutBtn.disabled = scale <= SCALE_MIN;
    if (zoomInBtn) zoomInBtn.disabled = scale >= SCALE_MAX;
  }

  async function render(): Promise<void> {
    if (rendering) {
      pendingRender = true;
      return;
    }
    rendering = true;

    try {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const context = canvasEl.getContext('2d');
      if (!context) return;

      const outputScale = window.devicePixelRatio || 1;
      canvasEl.width = Math.floor(viewport.width * outputScale);
      canvasEl.height = Math.floor(viewport.height * outputScale);
      canvasEl.style.width = `${Math.floor(viewport.width)}px`;
      canvasEl.style.height = `${Math.floor(viewport.height)}px`;

      await page.render({
        canvasContext: context,
        viewport,
        transform:
          outputScale !== 1
            ? [outputScale, 0, 0, outputScale, 0, 0]
            : undefined,
      }).promise;

      statusEl.hidden = true;
      canvasWrapEl.hidden = false;
      if (!viewCounted) {
        viewCounted = true;
        reachGoal('pdf_view', { document_id: documentId });
      }
    } catch {
      statusEl.textContent = 'Не удалось отобразить страницу.';
      statusEl.hidden = false;
      canvasWrapEl.hidden = true;
    } finally {
      rendering = false;
      if (pendingRender) {
        pendingRender = false;
        void render();
      }
    }
  }

  function goTo(page: number): void {
    const next = Math.min(Math.max(page, 1), totalPages);
    if (next === pageNumber) return;
    pageNumber = next;
    canvasWrapEl.scrollTop = 0;
    canvasWrapEl.scrollLeft = 0;
    updateControls();
    void render();
  }

  function setScale(next: number): void {
    const clamped = Math.min(Math.max(next, SCALE_MIN), SCALE_MAX);
    if (clamped === scale) return;
    scale = clamped;
    updateControls();
    void render();
  }

  function zoom(delta: number): void {
    setScale(scale + delta);
  }

  async function fitTo(dimension: 'width' | 'height'): Promise<void> {
    const page = await doc.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const available =
      (dimension === 'width'
        ? canvasWrapEl.clientWidth
        : canvasWrapEl.clientHeight) - WRAP_PADDING;
    const baseSize = dimension === 'width' ? base.width : base.height;
    if (available <= 0 || baseSize <= 0) return;
    setScale(available / baseSize);
  }

  function commitPageInput(): void {
    const value = Number.parseInt(pageInputEl.value, 10);
    const next = Number.isNaN(value)
      ? pageNumber
      : Math.min(Math.max(value, 1), totalPages);
    pageInputEl.value = String(next);
    if (next !== pageNumber) goTo(next);
  }

  async function toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch {
      statusEl.textContent = 'Полноэкранный режим недоступен.';
      statusEl.hidden = false;
    }
  }

  function isEditableTarget(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      (target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable)
    );
  }

  function formatPdfDate(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const match = /^D:(\d{4})(\d{2})(\d{2})/.exec(value);
    if (!match) return null;
    return `${match[3]}.${match[2]}.${match[1]}`;
  }

  async function buildInfoPanel(): Promise<void> {
    const rows: [string, string][] = [
      ['Название', title],
      ['Страниц', String(totalPages)],
    ];
    if (description) rows.push(['Описание', description]);
    if (fileName) rows.push(['Файл', fileName]);

    try {
      const { info } = await doc.getMetadata();
      const raw = info as Record<string, unknown>;
      if (typeof raw.Author === 'string' && raw.Author) {
        rows.push(['Автор', raw.Author]);
      }
      const created = formatPdfDate(raw.CreationDate);
      if (created) rows.push(['Дата создания', created]);
    } catch {
      void 0;
    }

    const list = document.createElement('dl');
    list.className = 'modal__list';
    for (const [term, value] of rows) {
      const termEl = document.createElement('dt');
      termEl.textContent = term;
      const valueEl = document.createElement('dd');
      valueEl.textContent = value;
      list.append(termEl, valueEl);
    }
    infoContentEl.replaceChildren(list);
  }

  function setInfoOpen(open: boolean): void {
    infoModalEl.hidden = !open;
    infoBtn?.setAttribute('aria-expanded', String(open));
    if (open) modalClose?.focus();
  }

  function toggleInfo(): void {
    const open = infoModalEl.hidden;
    setInfoOpen(open);
    if (open) void buildInfoPanel();
  }

  prevBtn?.addEventListener('click', () => goTo(pageNumber - 1));
  nextBtn?.addEventListener('click', () => goTo(pageNumber + 1));
  zoomInBtn?.addEventListener('click', () => zoom(SCALE_STEP));
  zoomOutBtn?.addEventListener('click', () => zoom(-SCALE_STEP));
  actualSizeBtn?.addEventListener('click', () => setScale(1));
  infoBtn?.addEventListener('click', toggleInfo);
  fitWidthBtn?.addEventListener('click', () => void fitTo('width'));
  fitHeightBtn?.addEventListener('click', () => void fitTo('height'));
  fullscreenBtn?.addEventListener('click', () => void toggleFullscreen());
  downloadLink?.addEventListener('click', () =>
    reachGoal('pdf_download', { document_id: documentId }),
  );

  pageInputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      commitPageInput();
      pageInputEl.blur();
    }
  });
  pageInputEl.addEventListener('change', commitPageInput);

  document.addEventListener('fullscreenchange', () => {
    const active = document.fullscreenElement === container;
    fullscreenBtn?.setAttribute('aria-pressed', String(active));
    if (fullscreenEnterIcon && fullscreenExitIcon) {
      fullscreenEnterIcon.style.display = active ? 'none' : '';
      fullscreenExitIcon.style.display = active ? '' : 'none';
    }
  });

  modalBackdrop?.addEventListener('click', () => setInfoOpen(false));
  modalClose?.addEventListener('click', () => setInfoOpen(false));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setInfoOpen(false);
      return;
    }
    if (!infoModalEl.hidden) return;
    if (isEditableTarget(event.target)) return;
    switch (event.key) {
      case 'ArrowLeft':
        goTo(pageNumber - 1);
        break;
      case 'ArrowRight':
        goTo(pageNumber + 1);
        break;
      case '+':
      case '=':
        zoom(SCALE_STEP);
        break;
      case '-':
      case '_':
        zoom(-SCALE_STEP);
        break;
      default:
        return;
    }
    event.preventDefault();
  });

  updateControls();
  await render();
}
