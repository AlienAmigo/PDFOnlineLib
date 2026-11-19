import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const SCALE_STEP = 0.25;
const SCALE_MIN = 0.5;
const SCALE_MAX = 3;

export async function initViewer(container: HTMLElement): Promise<void> {
  const url = container.dataset.url;
  if (!url) return;

  const canvas = container.querySelector<HTMLCanvasElement>(
    '[data-role="canvas"]',
  );
  const canvasWrap = container.querySelector<HTMLElement>(
    '[data-role="canvas-wrap"]',
  );
  const status = container.querySelector<HTMLElement>('[data-role="status"]');
  const pageInfo = container.querySelector<HTMLElement>(
    '[data-role="page-info"]',
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

  if (!canvas || !canvasWrap || !status || !pageInfo) return;

  const canvasEl: HTMLCanvasElement = canvas;
  const pageInfoEl: HTMLElement = pageInfo;

  let doc: pdfjsLib.PDFDocumentProxy;
  try {
    doc = await pdfjsLib.getDocument(url).promise;
  } catch {
    status.textContent = 'Не удалось загрузить документ.';
    return;
  }

  let pageNumber = 1;
  let scale = 1.25;
  let rendering = false;
  let pendingRender = false;

  const totalPages = doc.numPages;

  function updateControls(): void {
    pageInfoEl.textContent = `${pageNumber} / ${totalPages}`;
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
        outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
    }).promise;

    rendering = false;
    if (pendingRender) {
      pendingRender = false;
      void render();
    }
  }

  function goTo(page: number): void {
    const next = Math.min(Math.max(page, 1), totalPages);
    if (next === pageNumber) return;
    pageNumber = next;
    updateControls();
    void render();
  }

  function zoom(delta: number): void {
    const next = Math.min(Math.max(scale + delta, SCALE_MIN), SCALE_MAX);
    if (next === scale) return;
    scale = next;
    updateControls();
    void render();
  }

  prevBtn?.addEventListener('click', () => goTo(pageNumber - 1));
  nextBtn?.addEventListener('click', () => goTo(pageNumber + 1));
  zoomInBtn?.addEventListener('click', () => zoom(SCALE_STEP));
  zoomOutBtn?.addEventListener('click', () => zoom(-SCALE_STEP));

  status.hidden = true;
  canvasWrap.hidden = false;
  updateControls();
  await render();
}
