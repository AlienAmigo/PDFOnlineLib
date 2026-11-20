# AGENTS.md

Проект — **pdf-viewer**, статический сайт для просмотра PDF-документов на **Astro 7**
(TypeScript ~5.9, SCSS, PDF.js 4, Node.js >= 22.12). Бэкенда нет: сборка `astro build` выдаёт
статику в `dist/`, которую можно отдавать любым веб-сервером или объектным хранилищем.
Документация Astro: <https://docs.astro.build/> (актуальную версию см. в `package.json`).

## Команды

| Команда                | Что делает                                                          |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run dev`          | Dev-сервер Astro (http://localhost:4321/)                           |
| `npm run build`        | Сборка под корень (`/`) в `dist/`                                   |
| `npm run build:gh`     | Сборка под GitHub Pages (`/PDFOnlineLib/`)                          |
| `npm run build:prod`   | Сборка под корень продакшена (`/`)                                  |
| `npm run preview`      | Локальная отдача последней сборки (`dist/`)                         |
| `npm run preview:gh`   | Локальная отдача GH-сборки по `http://localhost:4321/PDFOnlineLib/` |
| `npm run deploy-gh`    | Сборка под GH Pages и публикация в ветку `gh-pages`                 |
| `npm run lint`         | ESLint (flat config, `eslint.config.js`)                            |
| `npm run format`       | Prettier: автоформатирование всех файлов                            |
| `npm run format:check` | Prettier: проверка форматирования без записи                        |
| `npx tsc --noEmit`     | Проверка типов                                                      |

Перед завершением задачи обязательны без ошибок: `npm run build`, `npm run lint` и
`npm run format:check`. Если менялись страницы или скрипт просмотрщика, дополнительно
проверьте результат в браузере через `npm run preview`.

## Структура

```
README.md                   обзор проекта и быстрый старт
docs/                       документация: adding-documents, development, deployment, roadmap
astro.config.mjs            конфиг Astro (output: 'static')
tsconfig.json               extends astro/tsconfigs/strict
eslint.config.js            ESLint flat config (typescript-eslint + eslint-plugin-astro)
.prettierrc                 Prettier (singleQuote, prettier-plugin-astro)
public/
  favicon.svg               иконка сайта (тот же логотип, что в шапке)
  pdf/                      PDF-файлы, отдаются как статика по /pdf/<имя>
src/
  config.ts                 siteConfig: название, копирайт, все пути сайта
  env.d.ts                  ссылки на типы astro/client и vite/client
  components/
    header/                 Header.astro + header.scss (шапка с логотипом)
    footer/                 Footer.astro + footer.scss (футер с копирайтом)
    viewer/                 Toolbar.astro + toolbar.scss (тулбар просмотрщика, .button)
  data/
    pdfs.ts                 каталог документов: список, getPdfById, URL файлов
  layouts/
    BaseLayout.astro        общий шаблон: <Header/>, <slot/>, <Footer/>
  pages/
    index.astro             главная («В разработке»)
    404.astro               страница 404
    view/[id].astro         просмотр PDF: статическая генерация по каталогу
  scripts/
    viewer.ts               клиентская логика PDF.js (рендер в canvas, пагинация, зум,
                            fit по ширине/высоте, fullscreen, ввод страницы, клавиатура)
  styles/
    vars/                   дизайн-токены — CSS custom properties (объявлены в :root):
                            colors.scss (цвета), layout.scss (--container-width)
    main.scss               глобальные стили: reset, page, container, visually-hidden,
                            placeholder, каркас viewer (canvas, status, fullscreen)
```

Слои: `config` (пути/настройки) → `data` (каталог документов) → `pages`/`layouts` (UI) →
`scripts` (клиентская логика). Импорты идут «сверху вниз»: страницы импортируют данные и
конфиг, данные импортируют только конфиг, конфиг не импортирует ничего.

## Пути

Единственный источник правды для URL — `siteConfig.paths` в `src/config.ts`:

| Путь             | Куда ведёт                       |
| ---------------- | -------------------------------- |
| `paths.home`     | `/`                              |
| `paths.view(id)` | `/view/<id>`                     |
| `paths.pdf(f)`   | `/pdf/<имя файла>` (public/pdf/) |

- В разметке не хардкодить URL — только через `siteConfig.paths`.
- Сайт деплоится на GitHub Pages под подпутём `/PDFOnlineLib/`. `base` выбирается
  автоматически в `astro.config.mjs` по переменной `DEPLOY_TARGET=gh-pages`;
  по умолчанию (dev, `npm run build`, `npm run build:prod`) используется корень `/`.
  `siteConfig.paths` уже включают `import.meta.env.BASE_URL`; для прочих статических
  ссылок в разметке (favicon и т.п.) — тоже `${import.meta.env.BASE_URL}<путь>`,
  а не `/`-от-корня.
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
- Стили — SCSS, методология БЭМ (`block__element--modifier`). Глобальные стили — в
  `src/styles/main.scss`; стили компонента — рядом с ним (`components/<name>/<name>.scss`,
  подключаются импортом во frontmatter компонента). Стили в `<style>` внутри
  `.astro`-файлов не пишем.
- Дизайн-токены — CSS custom properties в `src/styles/vars/*.scss` (объявлены в `:root`,
  одна группа токенов — один файл). В стилях используем `var(--color-*)` и т.п.
- Разметка `components/viewer/Toolbar.astro` связана с `src/scripts/viewer.ts` контрактом
  на `data-action`/`data-role`-атрибуты — менять только синхронно.
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
- В каталоге один документ `sample` (`public/pdf/sample.pdf`).
- Лэйаут фиксированный: шапка и футер всегда у краёв viewport, прокручивается только
  `.page__content`; на странице просмотра прокрутка — внутри `.viewer__canvas-wrap`.
- Счётчики просмотров/скачиваний и админка из исходного ТЗ в этот вариант не входят и
  потребуют отдельного бэкенда.
