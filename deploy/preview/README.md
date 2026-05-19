# Preview Deployment For Timeweb VDS

Этот контур не трогает локальную разработку. Он живет отдельно и поднимается из `deploy/preview/docker-compose.yml`.

## Что поднимается

- `proxy`: Caddy с HTTP Basic Auth
- `web`: Next.js в production
- `backend`: Strapi в production
- `postgres`: отдельная Postgres-база для preview

## Почему здесь VDS, а не App Platform

Для вашего проекта нужен полный стек `Next.js + Strapi + Postgres` и закрытый preview. На Timeweb Cloud это проще и безопаснее держать на VDS с Docker Compose.

## 1. Подготовьте сервер

- Создайте VDS в Timeweb Cloud с Ubuntu.
- Установите Docker Engine и Docker Compose Plugin.
- Откройте только нужный порт. Если preview будет по IP, достаточно `80`. Если будет домен и HTTPS, откройте `80` и `443`.
- Скопируйте проект на сервер.

## 2. Подготовьте переменные окружения

```bash
cd deploy/preview
cp .env.example .env
```

Минимум, что нужно заполнить:

- `PREVIEW_SITE_ADDRESS`
- `PREVIEW_BASIC_AUTH_PASSWORD_HASH`
- `NEXT_PUBLIC_STRAPI_URL`
- `DATABASE_PASSWORD`
- все Strapi secrets

Хэш для Basic Auth:

```bash
docker run --rm caddy:2.10-alpine caddy hash-password --plaintext 'your-password'
```

## 3. Поднимите preview

```bash
cd deploy/preview
docker compose up -d --build
```

После этого сайт откроется по адресу из `PREVIEW_SITE_ADDRESS` и попросит логин/пароль.

## 4. Перенесите данные из локальной Postgres

Compose поднимет пустую базу. Чтобы заказчик увидел текущий каталог, перенесите данные из вашей локальной БД.

Локальный экспорт:

```bash
PGPASSWORD=paritet123123 \
pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --host 127.0.0.1 \
  --port 5432 \
  --username paritet \
  --dbname paritet \
  --file paritet-preview.dump
```

Перенесите `paritet-preview.dump` на сервер и выполните восстановление:

```bash
cd deploy/preview
docker compose exec -T postgres sh -lc '
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -U "$DATABASE_USERNAME" \
  -d "$DATABASE_NAME"
' \
  < /path/to/paritet-preview.dump
```

## 5. Медиафайлы

`apps/backend/public/uploads` уже входят в образ и при первом старте копируются в отдельный volume preview-контура. Это позволяет не смешивать preview-загрузки с локальной разработкой.

Важно:

- если вы добавите новые файлы через админку preview, они останутся только в volume на сервере;
- локальный проект от этого не меняется;
- при полном удалении volume preview-загрузки пропадут.

## 6. Как закрыть доступ только для заказчика

Базовый вариант уже готов: один логин/пароль через Caddy Basic Auth.

Если нужен еще более жесткий режим:

- ограничьте вход в панели Timeweb по IP через Firewall;
- оставьте наружу только `80/443`;
- дайте ссылку и пароль только заказчику.

## 7. Обновление preview

```bash
cd deploy/preview
docker compose up -d --build
```

Если вы меняли только контент в базе, пересборка не нужна.
