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
- Amazon-style storefront: dark header with search autocomplete, deals/best-seller shelves, hero carousel
- Product catalog with URL-driven filters (brand, price, rating, stock, deals), sorting and pagination
- Product pages with gallery, buy box, reviews, Q&A, frequently-bought-together and recently viewed
- Shopping cart with persistent storage
- User authentication (NextAuth.js)
- Simple checkout (no real payment, orders are created instantly)
- Admin dashboard for products and orders

**Tech stack**
- **Frontend:** Next.js 16 | React 19 | TypeScript 5.9 | Tailwind CSS | shadcn/ui
- **Backend:** Server Components | Server Actions | API Routes
- **Database:** PostgreSQL 15 | Prisma 5.22

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
# Edit .env.local with your database URL and NextAuth secret

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
```

See [.env.example](.env.example) for the complete list.

## Demo Data

`npm run db:seed` wipes and recreates a deterministic demo shop: 13 categories, 92 products (brands, bullets, specs, stock levels including out-of-stock and low-stock items, discounts), ~1,300 reviews, Q&A, and one order in every status for the demo customer.

- Demo customer: `customer@example.com` / `customer123` (also a one-click button on the sign-in page).
- Admins come from `ADMIN_EMAILS` / `ADMIN_PASSWORD`.
- **Reset from the UI:** sign in as admin, open **Admin → Demo tools**, click *Reset demo data*.
- Product and category images are SVG placeholders in `public/images`. Regenerate them after editing `prisma/seed-data.ts` with `npm run db:placeholders`.

Existing database? Apply the new tables first with `npx prisma migrate deploy` (or `npx prisma db push`), then reseed.

## Project Structure

```
app/
├── (store)/          # Customer-facing pages (products, cart, search)
├── (account)/        # User account pages
├── admin/            # Admin dashboard
├── api/              # API routes (auth, checkout, cart, products)
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
npm run db:seed       # Wipe and reseed demo data
npm run db:placeholders # Regenerate SVG placeholder images
npm run db:studio     # Open Prisma Studio

npm run lint          # ESLint
npm run type-check    # TypeScript check
npm run format        # Prettier
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
