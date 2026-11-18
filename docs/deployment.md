# Деплой

Сайт — статика: после `npm run build` весь результат лежит в `dist/`. Node.js на сервере
**не нужен** — подойдёт любой способ отдачи статических файлов.

## Требования к серверу

Минимальные: любой VPS или shared-хостинг с веб-сервером (Nginx/Apache) либо объектное
хранилище со статическим хостингом (Selectel S3, Yandex Object Storage, Timeweb и т.п.).
Нагрузка небольшая: самые тяжёлые файлы — сами PDF и бандл PDF.js (~350 КБ + воркер ~1,4 МБ,
кэшируются браузером).

## Вариант 1: Nginx на VPS

1. Соберите сайт локально и скопируйте `dist/` на сервер:

   ```bash
   npm run build
   rsync -avz --delete dist/ user@server:/var/www/pdf-viewer/
   ```

2. Конфиг Nginx (`/etc/nginx/sites-available/pdf-viewer`):

   ```nginx
   server {
       listen 80;
       server_name example.ru;

       root /var/www/pdf-viewer;
       index index.html;

       location / {
           try_files $uri $uri/ /404.html;
       }

       location /pdf/ {
           add_header Cache-Control "public, max-age=31536000, immutable";
       }

       location /_astro/ {
           add_header Cache-Control "public, max-age=31536000, immutable";
       }
   }
   ```

   Особенности:

   - `try_files ... /404.html` — отдача страницы 404 для несуществующих адресов.
   - `/_astro/` — фингерпринтированные ассеты Vite, кэшируем надолго.
   - `/pdf/` — сами документы, тоже кэшируем.

3. Активируйте и перезагрузите:

   ```bash
   sudo ln -s /etc/nginx/sites-available/pdf-viewer /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. HTTPS — через Certbot (`sudo certbot --nginx -d example.ru`).

## Вариант 2: Объектное хранилище (S3)

Загрузите содержимое `dist/` в бакет с включённым статическим хостингом, укажите
`index.html` как индексный документ и `404.html` как страницу ошибки. Подойдёт для
самого дешёвого размещения, но уточните у провайдера поддержку pretty-URL
(`/view/sample` → `/view/sample/index.html`) — иначе используйте вариант с Nginx.

## Обновление сайта

Повторить сборку и выгрузку `dist/` (шаг 1). Для автоматизации можно настроить CI
(GitHub Actions): сборка по пушу в `main` и выгрузка по `rsync`/SSH.

## Проверка после деплоя

- Главная открывается и показывает «В разработке».
- `/view/<id>` реального документа загружает PDF, работают пагинация, зум, «Скачать».
- Несуществующий адрес отдаёт страницу 404.
