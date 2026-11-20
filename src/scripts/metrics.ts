import { siteConfig } from '../config';

declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...args: unknown[]) => void;
  }
}

export function reachGoal(
  target: string,
  params?: Record<string, string>,
): void {
  if (siteConfig.yandexMetrikaId <= 0) return;
  const { ym } = window;
  if (typeof ym !== 'function') return;
  if (params) {
    ym(siteConfig.yandexMetrikaId, 'reachGoal', target, params);
  } else {
    ym(siteConfig.yandexMetrikaId, 'reachGoal', target);
  }
}
