# Paritet Cosmetic

## О проекте
Paritet Cosmetic — портфолио-проект сайта-визитки компании-поставщика косметической продукции.

## Статус
Проект в разработке.
Текущий этап: desktop-версия интерфейса.
Мобильная версия запланирована отдельным этапом.

## Доступ к проекту
- Онлайн-демо: пока не опубликовано.
- Локальная проверка для разработчика: `http://localhost:3000` после запуска фронтенда.

## Технологии
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Strapi (backend API)
- PostgreSQL

## Что реализовано
- Главная страница с desktop-композицией
- Каталог с разделами lifestyle и luxury
- Детальные страницы брендов и продуктов
- Подключение изображений и данных из backend

## Структура
```text
Paritet-Cosmetics/
├─ apps/
│  ├─ web/       # frontend
│  └─ backend/   # API и контент
├─ deploy/
├─ docs/
└─ screenshots/
```

## Скриншот
![Desktop preview](screenshots/desktop-preview.png)

## Планы
- Отдельная адаптация под mobile
- Полировка контента и типографики
- Финальная оптимизация производительности

## Локальный запуск
1. Установить зависимости frontend:
   ```bash
   cd apps/web
   npm install
   ```
2. Запустить frontend:
   ```bash
   npm run dev
   ```
3. При необходимости отдельно поднять backend в `apps/backend`.
