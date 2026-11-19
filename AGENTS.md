# AGENTS.md

Проект — **pdf-viewer**, статический сайт для просмотра PDF-документов на **Astro 7**
(TypeScript ~5.9, SCSS, PDF.js 4, Node.js >= 22.12). Бэкенда нет: сборка `astro build` выдаёт
статику в `dist/`, которую можно отдавать любым веб-сервером или объектным хранилищем.
Документация Astro: <https://docs.astro.build/> (актуальную версию см. в `package.json`).

## Команды

| Команда           | Что делает                                             |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Dev-сервер Astro (http://localhost:4321)               |
| `npm run build`   | Продакшен-сборка статики в `dist/`                     |
| `npm run preview` | Локальная отдача собранного `dist/` для проверки       |
| `npx tsc --noEmit`| Проверка типов                                         |

Перед завершением задачи обязателен `npm run build` без ошибок — это одновременно и проверка
типов, и сборка. Если менялись страницы или скрипт просмотрщика, дополнительно проверьте
результат в браузере через `npm run preview`.

## Структура

```
README.md                   обзор проекта и быстрый старт
docs/                       документация: adding-documents, development, deployment, roadmap
astro.config.mjs            конфиг Astro (output: 'static')
tsconfig.json               extends astro/tsconfigs/strict
public/
  favicon.svg               иконка сайта (тот же логотип, что в шапке)
  pdf/                      PDF-файлы, отдаются как статика по /pdf/<имя>
src/
  config.ts                 siteConfig: название, копирайт, все пути сайта
  env.d.ts                  ссылки на типы astro/client и vite/client
  data/
    pdfs.ts                 каталог документов: список, getPdfById, URL файлов
  layouts/
    BaseLayout.astro        общий шаблон: шапка с логотипом, <slot/>, футер
  pages/
    index.astro             главная («В разработке»)
    404.astro               страница 404
    view/[id].astro         просмотр PDF: статическая генерация по каталогу
  scripts/
    viewer.ts               клиентская логика PDF.js (рендер в canvas, пагинация, зум)
  styles/
    main.scss               все стили (переменные, шапка, футер, viewer, кнопки)
```

Слои: `config` (пути/настройки) → `data` (каталог документов) → `pages`/`layouts` (UI) →
`scripts` (клиентская логика). Импорты идут «сверху вниз»: страницы импортируют данные и
конфиг, данные импортируют только конфиг, конфиг не импортирует ничего.

## Пути

Единственный источник правды для URL — `siteConfig.paths` в `src/config.ts`:

| Путь             | Куда ведёт                        |
| ---------------- | --------------------------------- |
| `paths.home`     | `/`                               |
| `paths.view(id)` | `/view/<id>`                      |
| `paths.pdf(f)`   | `/pdf/<имя файла>` (public/pdf/)  |

- В разметке не хардкодить URL — только через `siteConfig.paths`.
- Импорты внутри `src` — относительные (`../config`, `../../layouts/BaseLayout.astro`);
  алиасы не настроены и не нужны.
- URL файла документа собирается в `src/data/pdfs.ts` (`pdfList[].url`), страницы работают
  уже с готовым `url`.

## Добавление документа

1. Положить файл в `public/pdf/`.
2. Добавить запись в массив `entries` в `src/data/pdfs.ts` (`id`, `title`, `description`,
   `fileName`). `id` — это slug страницы `/view/<id>`, латиница/цифры/дефис.
3. `npm run build` — страница просмотра генерируется автоматически через `getStaticPaths`.
   Документ без записи в каталоге недоступен, неизвестный `id` отдаёт 404.

## Соглашения

- Страницы — только через `src/layouts/BaseLayout.astro` (шапка и футер не дублируются).
- Стили — SCSS в `src/styles/main.scss`, методология БЭМ (`block__element--modifier`),
  дизайн-токены — SCSS-переменные в начале файла (`$color-*`, `$container-width`).
  Стили в `.astro`-файлах не пишем.
- Клиентский JS — TypeScript-модули в `src/scripts/`, подключаются из `.astro` через
  `<script>` с импортом (Astro сам собирает их Vite'ом). Инициализация — через функцию
  `init*(container)`, данные передаются в DOM `data-*`-атрибутами, а не `define:vars`.
- Воркер PDF.js подключается как `import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'`
  (Vite-импорт) — не указывать workerSrc строкой и не тянуть воркер с CDN.
- Файлы: страницы/шаблоны — `PascalCase.astro` (`BaseLayout.astro`), модули — `camelCase.ts`
  (`viewer.ts`, `pdfs.ts`), папки — `camelCase`.
- Типизация строгая (`astro/tsconfigs/strict`): без `any` и `@ts-ignore`; DOM-элементы
  находятся через `querySelector<HTML...>` с проверкой на `null`.

## Чего не делать

- Не добавлять бэкенд, SSR-адаптеры и зависимости ради «на будущее» — вариант осознанно
  экономный: статика + ручное добавление PDF.
- Не выносить URL из `siteConfig.paths` в разметку.
- Не коммитить `dist/`, `.astro/`, `node_modules/` (см. `.gitignore`).

## Текущее состояние

- Главная — заглушка «В разработке»; каталог документов на ней ещё не выводится.
- В каталоге один тестовый документ `sample` (`public/pdf/sample.pdf`, сгенерирован для
  проверки) — при появлении реальных документов его запись в `src/data/pdfs.ts` можно удалить.
- Счётчики просмотров/скачиваний и админка из исходного ТЗ в этот вариант не входят и
  потребуют отдельного бэкенда.
