# Demo Shop

[![Next.js](https://img.shields.io/badge/Next.js_15.5-000?logo=next.js&logoColor=fff)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.9-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma_5.22-2D3748?logo=prisma&logoColor=fff)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Fictional demo store for testing and showing Askdepth to clients.**
> All products, brands, users and orders are made up. Not a real shop and not intended for production use.

## Purpose

Demo Shop is a realistic e-commerce storefront that we use as a test site for [Askdepth](https://github.com/askdepth):

- **Testing:** a safe, fully controlled site to integrate and test Askdepth on (catalog, search, cart, checkout, accounts).
- **Client demos:** a ready-made store to show how Askdepth works on a real-looking e-commerce site.

Because the data is fictional, it can be reset, reseeded and broken freely without any consequences.

## What's Inside

**Store features**
- Product catalog with search, filtering and categories
- Shopping cart with persistent storage
- User authentication (NextAuth.js)
- Stripe checkout (test mode only)
- Admin dashboard for products and orders
- Newsletter subscription

**Tech stack**
- **Frontend:** Next.js 15.5 | React 18 | TypeScript 5.9 | Tailwind CSS | shadcn/ui
- **Backend:** Server Components | Server Actions | API Routes
- **Database:** PostgreSQL 15 | Prisma 5.22
- **Testing:** Jest | React Testing Library | Cypress

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm

### Installation

```bash
git clone https://github.com/askdepth/demo-shop.git
cd demo-shop

npm install

cp .env.example .env.local
# Edit .env.local with your database URL and keys

npx prisma db push
npm run db:seed

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Essential environment variables

```env
# Database (required)
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"

# NextAuth (required)
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (optional, use test keys only)
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
```

See [.env.example](.env.example) for the complete list.

## Demo Data

`npm run db:seed` fills the database with fictional products, categories and users. Re-run it (after `npx prisma db push --force-reset` if needed) to restore a clean state before a client demo.

## Project Structure

```
app/
├── (store)/          # Customer-facing pages (products, cart, search)
├── (account)/        # User account pages
├── admin/            # Admin dashboard
├── api/              # API routes (auth, newsletter, stripe)
└── not-found.tsx     # Custom 404 page

components/           # UI components (shadcn/ui, product card, cart drawer, ...)
server/               # Server actions and database queries
prisma/               # Schema and seed data
```

## Scripts

```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm run start         # Start production server

npm run db:push       # Push schema changes
npm run db:seed       # Seed with sample data
npm run db:studio     # Open Prisma Studio

npm run lint          # ESLint
npm run type-check    # TypeScript check
npm run format        # Prettier

npm run test          # Unit tests
npm run test:e2e      # Cypress tests
```

## Deployment

**Vercel** — connect the repo, add environment variables, deploy on push.

**Docker**
```bash
docker-compose up -d
```

or build manually:
```bash
docker build -t demo-shop .
docker run -p 3000:3000 -e DATABASE_URL="..." demo-shop
```

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

Based on the open-source [Nextjs-Ecommerce](https://github.com/SatvikPraveen/Nextjs-Ecommerce) template by SatvikPraveen. Built with [Next.js](https://nextjs.org/), [Prisma](https://www.prisma.io/), [shadcn/ui](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/).
