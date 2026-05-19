This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Design variants (A/B/C)

В репозитории поддерживается несколько вариантов дизайна landing/hero в одном кодбейзе.

### Как переключать вариант

По умолчанию используется Variant A.

Переключение делается через переменную окружения.

`.env.local` нужно создать руками в корне Next-проекта, то есть **в папке `apps/web` (рядом с `package.json`)**.
Пример содержимого можно взять из `apps/web/.env.example`.

Минимальный пример:

```bash
NEXT_PUBLIC_DESIGN_VARIANT=a # или b / c
```

Также поддерживается `DESIGN_VARIANT` (если не хочется прокидывать значение в публичные env).

### Где лежит код вариантов

- Диспетчер: `components/landing/Landing.tsx`
- Варианты:
  - `components/landing/variant-a/LandingVariantA.tsx`
  - `components/landing/variant-b/LandingVariantB.tsx`
  - `components/landing/variant-c/LandingVariantC.tsx`

Текущий вариант доступен в рантайме через `getDesignVariant()` из `lib/design-variant.ts`.

### Как добавить Variant D

1. Создать компонент, например `components/landing/variant-d/LandingVariantD.tsx`.
2. Расширить тип `DesignVariant` и реестр в `components/landing/Landing.tsx`.
3. (Опционально) добавить/изолировать стили под новый вариант.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
