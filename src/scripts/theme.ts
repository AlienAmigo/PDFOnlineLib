type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    // localStorage может быть недоступен (приватный режим и т.п.)
    return null;
  }
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function initTheme(container: HTMLElement): void {
  const button = container.querySelector<HTMLButtonElement>(
    '[data-action="toggle-theme"]',
  );
  if (!button) return;

  const syncButton = (): void => {
    button.setAttribute(
      'aria-checked',
      String(document.documentElement.dataset.theme === 'dark'),
    );
  };

  button.addEventListener('click', () => {
    const next: Theme =
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // см. getStoredTheme
    }
    syncButton();
  });

  // Без сохранённого выбора следуем за системной темой
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (event) => {
      if (getStoredTheme() !== null) return;
      applyTheme(event.matches ? 'dark' : 'light');
      syncButton();
    });

  syncButton();
}
