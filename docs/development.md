# Разработка

## Окружение

- **Node.js >= 22.23.4** и npm (актуальное требование Astro 7).
- Установка зависимостей: `npm install`.

## Команды

| Команда                | Что делает                                                   |
| ---------------------- | ------------------------------------------------------------ |
| `npm run dev`          | Dev-сервер с горячей перезагрузкой, http://localhost:4321    |
| `npm run build`        | Сборка под корень (`/`) в `dist/`                            |
| `npm run build:gh`     | Сборка под GitHub Pages (`/PDFOnlineLib/`)                   |
| `npm run build:prod`   | Сборка под корень продакшена (`/`)                           |
| `npm run preview`      | Локальная отдача последней сборки (`dist/`)                  |
| `npm run preview:gh`   | Локальная отдача GH-сборки по `localhost:4321/PDFOnlineLib/` |
| `npm run deploy-gh`    | Сборка под GH Pages и публикация в ветку `gh-pages`          |
| `npm run lint`         | ESLint (`eslint.config.js`)                                  |
| `npm run format`       | Prettier: автоформатирование всех файлов                     |
| `npm run format:check` | Prettier: проверка форматирования без записи                 |
| `npx tsc --noEmit`     | Проверка типов                                               |

Перед коммитом обязательны без ошибок: `npm run build`, `npm run lint` и
`npm run format:check`. Если менялись страницы или просмотрщик — дополнительно откройте
результат через `npm run preview` и проверьте в браузере.

## Качество кода

- **ESLint** (flat config в `eslint.config.js`): `typescript-eslint` (recommended) +
  `eslint-plugin-astro` (recommended) + `eslint-config-prettier` (отключает правила,
  конфликтующие с Prettier).
- **Prettier** (`.prettierrc`): `singleQuote`, плагин `prettier-plugin-astro` для
  `.astro`-файлов. Исключения — в `.prettierignore` (`dist`, `.astro`, `node_modules`,
  `package-lock.json`).
- Форматирование не привязывайте к редактору: перед коммитом достаточно `npm run format`.

## Архитектура

Сайт полностью статический (`output: 'static'` в `astro.config.mjs`). `base` выбирается
автоматически по переменной окружения `DEPLOY_TARGET`: по умолчанию `/`, для
`DEPLOY_TARGET=gh-pages` — `/PDFOnlineLib/`. На этапе сборки Astro генерирует по одной
HTML-странице на каждый документ из каталога (`src/pages/view/[id].astro` + `getStaticPaths`).
В рантайме серверного кода нет.

Все внутренние пути собираются через `siteConfig.paths`, который использует
`import.meta.env.BASE_URL`, поэтому переключение `base` не требует правок в страницах.

Слои и направление импортов:

```
config  →  data  →  pages / layouts  →  scripts (клиент)
```

- `src/config.ts` — `siteConfig`: название, копирайт, **все пути сайта**. URL в разметке
  не хардкодятся, только через `siteConfig.paths`.
- `src/components/` — переиспользуемые компоненты, каждый в своей папке вместе со
  стилями: `header/Header.astro` + `header.scss`, `footer/Footer.astro` + `footer.scss`,
  `viewer/Toolbar.astro` + `toolbar.scss`. Стили подключаются импортом во frontmatter
  компонента.
- `src/data/pdfs.ts` — каталог документов. Единственное место, которое меняется при
  добавлении PDF (см. [Добавление документа](adding-documents.md)).
- `src/layouts/BaseLayout.astro` — каркас страницы (`<Header/>`, `<slot/>`, `<Footer/>`);
  все страницы строятся только через него.
- `src/scripts/viewer.ts` — клиентская логика PDF.js: рендер текущей страницы в canvas,
  пагинация, зум. Подключается из `.astro` через `<script>` с импортом — Astro сам
  собирает его Vite'ом. Данные передаются в DOM через `data-*`-атрибуты.
- `src/styles/main.scss` — глобальные стили (reset, `page`, `container`,
  `visually-hidden`, `placeholder`, каркас просмотрщика). Дизайн-токены — CSS custom
  properties в `src/styles/vars/*.scss` (объявлены в `:root`, одна группа — один файл).
  Разметка `Toolbar.astro` связана с `viewer.ts` контрактом на `data-action`/`data-role`
  атрибуты — менять их нужно синхронно.

## Соглашения по коду

- **TypeScript строгий** (`astro/tsconfigs/strict`): без `any` и `@ts-ignore`.
  DOM-элементы — через `querySelector<HTML...>` с проверкой на `null`.
- **Воркер PDF.js** подключается Vite-импортом:
  `import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'` — не строкой и не с CDN.
- **Файлы**: страницы и шаблоны — `PascalCase.astro`, модули — `camelCase.ts`,
  папки — `camelCase`.
- **Импорты** внутри `src` — относительные; алиасы не настроены.
- Инициализация клиентских скриптов — функцией `init*(container: HTMLElement)`, которая
  экспортируется из модуля и вызывается в `<script>` страницы.

## Осознанные ограничения

Вариант «экономный»: без бэкенда, базы и админки. Поэтому:

- добавление/удаление документов — только через репозиторий и пересборку;
- счётчики просмотров и скачиваний из исходного ТЗ не реализованы — для них потребуется
  отдельный бэкенд (API + хранилище счётчиков) и, вероятно, переход части страниц на SSR.
