// server/queries/catalog.ts
// Storefront queries used by the Amazon-style listing, home shelves and product page.
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface CardProduct {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  price: number;
  comparePrice: number | null;
  image?: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockLeft: number | null;
  soldCount: number;
  category?: { name: string; slug: string };
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: Date;
}

const cardInclude = {
  category: { select: { name: true, slug: true } },
  images: { select: { url: true }, orderBy: { position: 'asc' as const }, take: 1 },
  inventory: { select: { available: true } },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export function toCard(p: CardRow): CardProduct {
  const stock = p.inventory.reduce((s, i) => s + i.available, 0);
  const tracked = p.trackQuantity;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    price: Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    image: p.images[0]?.url,
    rating: p.avgRating,
    reviewCount: p.reviewCount,
    inStock: !tracked || stock > 0,
    stockLeft: tracked && stock > 0 && stock <= 5 ? stock : null,
    soldCount: p.soldCount,
    category: p.category ?? undefined,
    status: p.status,
    createdAt: p.createdAt,
  };
}

export type SortKey =
  | 'featured'
  | 'price-low'
  | 'price-high'
  | 'rating'
  | 'newest'
  | 'popular'
  | 'discount';

export interface ListParams {
  q?: string;
  category?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  dealsOnly?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

async function categoryIds(slug?: string): Promise<string[] | undefined> {
  if (!slug) return undefined;
  const cat = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, children: { select: { id: true } } },
  });
  if (!cat) return [];
  return [cat.id, ...cat.children.map(c => c.id)];
}

function baseWhere(p: ListParams, catIds: string[] | undefined): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ status: 'PUBLISHED' }];
  if (catIds) and.push({ categoryId: { in: catIds } });
  const words = (p.q ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  for (const w of words) {
    and.push({
      OR: [
        { name: { contains: w, mode: 'insensitive' } },
        { brand: { contains: w, mode: 'insensitive' } },
        { description: { contains: w, mode: 'insensitive' } },
        { category: { name: { contains: w, mode: 'insensitive' } } },
        { tags: { has: w } },
      ],
    });
  }
  return { AND: and };
}

export async function listProducts(params: ListParams) {
  const page = Math.max(1, params.page ?? 1);
  const limit = params.limit ?? 24;
  const catIds = await categoryIds(params.category);
  const where = baseWhere(params, catIds);
  const and = where.AND as Prisma.ProductWhereInput[];

  if (params.brands?.length) and.push({ brand: { in: params.brands } });
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    and.push({ price: { gte: params.minPrice, lte: params.maxPrice } });
  }
  if (params.minRating) and.push({ avgRating: { gte: params.minRating } });
  if (params.inStockOnly) and.push({ inventory: { some: { available: { gt: 0 } } } });
  if (params.dealsOnly) and.push({ comparePrice: { not: null } });

  const sort = (params.sort ?? 'featured') as SortKey;
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === 'price-low'
      ? [{ price: 'asc' }]
      : sort === 'price-high'
        ? [{ price: 'desc' }]
        : sort === 'rating'
          ? [{ avgRating: 'desc' }, { reviewCount: 'desc' }]
          : sort === 'newest'
            ? [{ createdAt: 'desc' }]
            : [{ soldCount: 'desc' }];

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: cardInclude,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: rows.map(toCard),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Brand and sub-category counts for the sidebar, scoped to the current search/category only. */
export async function getFacets(params: Pick<ListParams, 'q' | 'category'>) {
  const catIds = await categoryIds(params.category);
  const where = baseWhere(params, catIds);
  const [brands, cats, price] = await Promise.all([
    prisma.product.groupBy({
      by: ['brand'],
      where,
      _count: { _all: true },
      orderBy: { _count: { brand: 'desc' } },
    }),
    prisma.product.groupBy({
      by: ['categoryId'],
      where: baseWhere({ q: params.q }, undefined),
      _count: { _all: true },
    }),
    prisma.product.aggregate({ where, _min: { price: true }, _max: { price: true } }),
  ]);
  const catRows = await prisma.category.findMany({
    where: { id: { in: cats.map(c => c.categoryId).filter((x): x is string => !!x) } },
    select: { id: true, name: true, slug: true, parent: { select: { slug: true, name: true } } },
  });
  const catCount = new Map(cats.map(c => [c.categoryId, c._count._all]));
  return {
    brands: brands
      .filter(b => b.brand)
      .map(b => ({ value: b.brand as string, count: b._count._all })),
    categories: catRows
      .map(c => ({
        slug: c.slug,
        name: c.name,
        parentSlug: c.parent?.slug ?? null,
        count: catCount.get(c.id) ?? 0,
      }))
      .sort((a, b) => b.count - a.count),
    priceMin: Number(price._min.price ?? 0),
    priceMax: Number(price._max.price ?? 0),
  };
}

export async function getCategoryTree() {
  const cats = await prisma.category.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, slug: true, image: true, parentId: true },
  });
  const tops = cats.filter(c => !c.parentId);
  return tops.map(t => ({
    ...t,
    children: cats.filter(c => c.parentId === t.id),
  }));
}

export async function getCategoryWithTrail(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: { parent: true, children: true },
  });
}

export type ShelfKind = 'bestsellers' | 'deals' | 'top-rated' | 'new';

export async function getShelf(kind: ShelfKind, limit = 10, categorySlug?: string) {
  const catIds = await categoryIds(categorySlug);
  const where: Prisma.ProductWhereInput = {
    status: 'PUBLISHED',
    ...(catIds ? { categoryId: { in: catIds } } : {}),
    ...(kind === 'deals' ? { comparePrice: { not: null } } : {}),
    ...(kind === 'top-rated' ? { reviewCount: { gte: 8 } } : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    kind === 'bestsellers' || kind === 'deals'
      ? [{ soldCount: 'desc' }]
      : kind === 'top-rated'
        ? [{ avgRating: 'desc' }, { reviewCount: 'desc' }]
        : [{ createdAt: 'desc' }];
  let rows = await prisma.product.findMany({
    where,
    include: cardInclude,
    orderBy,
    take: kind === 'deals' ? 60 : limit,
  });
  if (kind === 'deals') {
    rows = rows
      .sort((a, b) => discount(b) - discount(a))
      .slice(0, limit);
  }
  return rows.map(toCard);
}

function discount(p: { price: unknown; comparePrice: unknown }) {
  const price = Number(p.price);
  const compare = p.comparePrice ? Number(p.comparePrice) : 0;
  return compare > price ? (compare - price) / compare : 0;
}

/** Top-N product slugs by sales, used for the "Best Seller" badge. */
export async function getBestSellerSlugs(n = 12): Promise<Set<string>> {
  const rows = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { soldCount: 'desc' },
    take: n,
    select: { slug: true },
  });
  return new Set(rows.map(r => r.slug));
}

export async function getProductDetail(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { include: { parent: true } },
      images: { orderBy: { position: 'asc' } },
      inventory: { select: { available: true } },
    },
  });
  if (!product) return null;
  const [reviews, ratingGroups, questions] = await Promise.all([
    prisma.review.findMany({
      where: { productId: product.id },
      orderBy: [{ helpful: 'desc' }, { createdAt: 'desc' }],
      take: 30,
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where: { productId: product.id },
      _count: { _all: true },
    }),
    prisma.question.findMany({
      where: { productId: product.id },
      orderBy: [{ votes: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    }),
  ]);
  const histogram = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratingGroups.find(g => g.rating === star)?._count._all ?? 0,
  }));
  const stock = product.inventory.reduce((s, i) => s + i.available, 0);
  return { product, reviews, histogram, questions, stock };
}

export async function getFrequentlyBoughtWith(productId: string, categoryId: string | null) {
  if (!categoryId) return [];
  const rows = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: productId },
      categoryId,
      inventory: { some: { available: { gt: 0 } } },
    },
    include: cardInclude,
    orderBy: { soldCount: 'desc' },
    take: 2,
  });
  return rows.map(toCard);
}

export async function getRelated(productId: string, categoryId: string | null, limit = 8) {
  if (!categoryId) return [];
  const rows = await prisma.product.findMany({
    where: { status: 'PUBLISHED', categoryId, id: { not: productId } },
    include: cardInclude,
    orderBy: { avgRating: 'desc' },
    take: limit,
  });
  return rows.map(toCard);
}

export async function getSuggestions(q: string, limit = 8) {
  const query = q.trim();
  if (query.length < 2) return { products: [], categories: [] };
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { tags: { has: query.toLowerCase() } },
        ],
      },
      orderBy: { soldCount: 'desc' },
      take: limit,
      select: { name: true, slug: true, category: { select: { name: true } } },
    }),
    prisma.category.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      take: 3,
      select: { name: true, slug: true },
    }),
  ]);
  return { products, categories };
}
