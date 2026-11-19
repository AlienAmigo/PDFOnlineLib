# Разработка

## Окружение

- **Node.js >= 22.12** и npm.
- Установка зависимостей: `npm install`.

## Команды

| Команда                | Что делает                                                |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Dev-сервер с горячей перезагрузкой, http://localhost:4321 |
| `npm run build`        | Продакшен-сборка статики в `dist/`                        |
| `npm run preview`      | Локальная отдача собранного `dist/` (проверка результата) |
| `npm run lint`         | ESLint (`eslint.config.js`)                               |
| `npm run format`       | Prettier: автоформатирование всех файлов                  |
| `npm run format:check` | Prettier: проверка форматирования без записи              |
| `npx tsc --noEmit`     | Проверка типов                                            |

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

Сайт полностью статический (`output: 'static'` в `astro.config.mjs`): на этапе сборки
Astro генерирует по одной HTML-странице на каждый документ из каталога
(`src/pages/view/[id].astro` + `getStaticPaths`). В рантайме серверного кода нет.

Слои и направление импортов:

```
config  →  data  →  pages / layouts  →  scripts (клиент)
```

- `src/config.ts` — `siteConfig`: название, копирайт, **все пути сайта**. URL в разметке
  не хардкодятся, только через `siteConfig.paths`.
- `src/data/pdfs.ts` — каталог документов. Единственное место, которое меняется при
  добавлении PDF (см. [Добавление документа](adding-documents.md)).
- `src/layouts/BaseLayout.astro` — шапка с логотипом и футер; все страницы строятся
  только через него.
- `src/scripts/viewer.ts` — клиентская логика PDF.js: рендер текущей страницы в canvas,
  пагинация, зум. Подключается из `.astro` через `<script>` с импортом — Astro сам
  собирает его Vite'ом. Данные передаются в DOM через `data-*`-атрибуты.
- `src/styles/main.scss` — все стили, БЭМ, дизайн-токены в SCSS-переменных в начале файла.
  Стили в `.astro`-файлах не пишутся.

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
