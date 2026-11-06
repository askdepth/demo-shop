// Location: prisma/seed-lib.ts
// Deterministic demo-data seeding. Used by prisma/seed.ts and the admin "Reset demo data" action.

import { OrderStatus, PrismaClient, ProductStatus, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';
import { CATEGORIES, PRODUCTS, productImages } from './seed-data';

export const DEMO_CUSTOMER = {
  email: 'customer@example.com',
  password: 'customer123',
  name: 'John Doe',
};

// --- deterministic PRNG so every reseed gives the same shop ---
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = [
  'Emma R.', 'Liam K.', 'Olivia P.', 'Noah T.', 'Ava M.', 'Ethan W.', 'Sophia L.',
  'Mason B.', 'Isabella C.', 'Lucas H.', 'Mia D.', 'Logan F.', 'Amelia S.', 'James G.',
  'Harper N.', 'Benjamin J.', 'Evelyn Z.', 'Henry V.', 'Charlotte Q.', 'Jack Y.',
  'Priya S.', 'Marco D.', 'Yuki T.', 'Fatima A.', 'Carlos M.', 'Anna K.',
];

const TITLES: Record<number, string[]> = {
  5: ['Absolutely love it', 'Exceeded expectations', 'Best purchase this year', 'Worth every penny', 'Five stars, no regrets', 'Fantastic quality'],
  4: ['Very good, small nitpicks', 'Great value', 'Solid choice', 'Happy with it', 'Almost perfect'],
  3: ['It is okay', 'Decent but not amazing', 'Average for the price', 'Mixed feelings'],
  2: ['Disappointed', 'Not as described', 'Could be better'],
  1: ['Do not recommend', 'Broke quickly', 'Waste of money'],
};

const OPENERS: Record<number, string[]> = {
  5: ['I have been using this for a few weeks and it is fantastic.', 'Bought this as a gift and ended up getting one for myself too.', 'Arrived fast and exactly as pictured.'],
  4: ['Pretty happy overall.', 'Good product for the price.', 'Does what it says on the box.'],
  3: ['It does the job, nothing more.', 'Mixed experience so far.', 'Fine for casual use.'],
  2: ['I expected more based on the description.', 'Had a few issues right out of the box.'],
  1: ['Sadly this did not work out for me.', 'Stopped working after a short time.'],
};

const ASPECTS: Record<string, string[]> = {
  smartphones: ['The camera is excellent in low light.', 'Battery easily lasts a full day.', 'The screen is bright and smooth.', 'Setup took only a few minutes.'],
  laptops: ['The keyboard is comfortable for long typing sessions.', 'Fans stay quiet under normal load.', 'The display is sharp and bright.', 'Boots in seconds and handles multitasking well.'],
  audio: ['Sound is balanced with punchy bass.', 'Bluetooth pairing was instant.', 'Comfortable even after hours of wear.', 'Battery life matches the listing.'],
  'mens-clothing': ['The fit is true to size.', 'Fabric feels soft and durable after several washes.', 'Stitching looks well done.', 'Color matches the photos.'],
  'womens-clothing': ['The fit is flattering and true to size.', 'Fabric feels premium and does not wrinkle much.', 'Color is just like the pictures.', 'Great for both casual and dressy outfits.'],
  'home-garden': ['Easy to assemble and set up.', 'Looks great in our living room.', 'Sturdy build quality.', 'Does exactly what I needed around the house.'],
  'kitchen-dining': ['Cleanup is quick and easy.', 'Heats evenly and cooks great.', 'Feels sturdy and well built.', 'Makes my morning routine so much easier.'],
  'sports-outdoors': ['Held up well on the weekend trip.', 'Comfortable and sturdy during workouts.', 'Great grip and materials.', 'Packs down small, which is handy.'],
  books: ['The writing pulled me in right away.', 'Beautiful print quality and binding.', 'Could not put it down.', 'Clear, practical and easy to follow.'],
  beauty: ['Noticed a difference after two weeks.', 'Gentle on my skin, no irritation.', 'The scent is subtle and pleasant.', 'A little goes a long way.'],
  'toys-games': ['My kids played with it for hours.', 'Good quality pieces that feel durable.', 'Instructions were clear.', 'Great for family game night.'],
};

const CLOSERS: Record<number, string[]> = {
  5: ['Highly recommend!', 'Will buy again.', 'Easily five stars.'],
  4: ['Would recommend.', 'Minor issues but I would buy it again.'],
  3: ['Might be worth it on sale.', 'Does the job.'],
  2: ['Customer service was helpful, but the product fell short.', 'Probably will not buy again.'],
  1: ['Returning it.', 'Would not buy again.'],
};

const QA: Record<string, [string, string][]> = {
  smartphones: [
    ['Is this phone unlocked?', 'Yes, it is factory unlocked and works with all major carriers.'],
    ['Does it come with a charger?', 'A USB-C cable is included. The power adapter is sold separately.'],
    ['Does it support eSIM?', 'Yes, it supports one physical SIM and one eSIM.'],
  ],
  laptops: [
    ['How much RAM can it be upgraded to?', 'RAM is soldered on this model, so choose the configuration you need at purchase.'],
    ['Is a charger included in the box?', 'Yes, the power adapter and cable are included.'],
    ['Is it good for video editing?', 'It handles 1080p editing well. For heavy 4K projects consider a higher-tier model.'],
  ],
  audio: [
    ['Can I use it with two devices at once?', 'Yes, multipoint Bluetooth lets you stay connected to two devices.'],
    ['How long does the battery last?', 'About 30 hours with ANC off and about 24 hours with ANC on, based on our testing.'],
    ['Is it water resistant?', 'It is splash resistant but should not be submerged.'],
  ],
  'mens-clothing': [
    ['Does it run small or large?', 'It fits true to size. If you are between sizes we recommend sizing up.'],
    ['Is it machine washable?', 'Yes, machine wash cold with similar colors and tumble dry low.'],
  ],
  'womens-clothing': [
    ['Does it run small or large?', 'It fits true to size. Check the size chart for exact measurements.'],
    ['Is the fabric see-through?', 'No, it is opaque in all colors.'],
  ],
  'home-garden': [
    ['Is assembly required?', 'Minimal assembly with the included tools. It takes about 10 minutes.'],
    ['Is it safe to use outdoors?', 'Yes, it is rated for indoor and outdoor use.'],
  ],
  'kitchen-dining': [
    ['Is it dishwasher safe?', 'Removable parts are top-rack dishwasher safe. Hand washing extends their life.'],
    ['What is the warranty?', 'It comes with a 1-year limited warranty.'],
  ],
  'sports-outdoors': [
    ['Is it suitable for beginners?', 'Absolutely, it is designed for all experience levels.'],
    ['How much does it weigh?', 'Check the specifications section above for the exact weight.'],
  ],
  books: [
    ['Is this the hardcover or paperback edition?', 'This listing is for the paperback edition.'],
    ['Is it suitable for teenagers?', 'Yes, there is no explicit content and it is a great read for ages 13+.'],
  ],
  beauty: [
    ['Is it suitable for sensitive skin?', 'It is dermatologist tested and fragrance-light, but do a patch test first.'],
    ['Is it cruelty-free?', 'Yes, this product is not tested on animals.'],
  ],
  'toys-games': [
    ['What age is this recommended for?', 'See the age rating in the product details. Small parts may be a choking hazard for kids under 3.'],
    ['Are batteries included?', 'Batteries are not included.'],
  ],
};

const BULLET_POOL: Record<string, string[]> = {
  smartphones: ['Factory unlocked for all major carriers', 'All-day battery with fast charging', 'Advanced multi-lens camera system', 'Bright, smooth high-refresh display', '1-year manufacturer warranty'],
  laptops: ['Fast SSD storage and instant wake', 'Long-lasting battery for a full workday', 'Backlit keyboard and precision trackpad', 'Lightweight, portable design', '1-year manufacturer warranty'],
  audio: ['Rich, balanced sound with deep bass', 'Bluetooth 5.3 for stable connection', 'Comfortable design for all-day wear', 'Built-in microphone for calls', '12-month limited warranty'],
  'mens-clothing': ['Soft, breathable fabric', 'Tailored fit that holds its shape', 'Machine washable for easy care', 'Reinforced stitching for durability', 'Available in multiple sizes'],
  'womens-clothing': ['Soft, breathable fabric', 'Flattering fit and drape', 'Machine washable for easy care', 'Versatile for work and weekends', 'Available in multiple sizes'],
  'home-garden': ['Durable construction built to last', 'Simple setup in minutes', 'Designed for indoor and outdoor use', 'Energy-efficient design', '30-day satisfaction guarantee'],
  'kitchen-dining': ['Easy to clean, dishwasher-safe parts', 'Even heating and consistent results', 'Food-grade, BPA-free materials', 'Compact for small kitchens', '1-year limited warranty'],
  'sports-outdoors': ['Built for tough conditions', 'Lightweight and easy to carry', 'Comfortable, secure grip', 'Suitable for beginners and pros', '30-day satisfaction guarantee'],
  books: ['Engaging, well-researched content', 'High-quality print and binding', 'Perfect as a gift', 'Includes illustrations and reference notes'],
  beauty: ['Dermatologist tested', 'Cruelty-free and vegan formula', 'Visible results within weeks', 'Suitable for daily use', 'Free from parabens and sulfates'],
  'toys-games': ['Safe, non-toxic materials', 'Encourages creativity and learning', 'Great for family play', 'Durable pieces built for little hands', 'Recommended ages in product details'],
};

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)]!;
}

function shuffle<T>(rnd: () => number, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function specsFor(category: string, brand: string, rnd: () => number): Record<string, string> {
  const weightLb = (0.2 + rnd() * 4).toFixed(1);
  const dims = `${Math.round(4 + rnd() * 14)} × ${Math.round(3 + rnd() * 10)} × ${Math.round(1 + rnd() * 6)} in`;
  const base: Record<string, string> = { Brand: brand, Weight: `${weightLb} lbs`, Dimensions: dims };
  if (category === 'books') return { Publisher: brand, Language: 'English', Pages: String(180 + Math.floor(rnd() * 420)), Format: 'Paperback' };
  if (category.endsWith('clothing')) return { Brand: brand, Material: pick(rnd, ['100% Cotton', 'Cotton blend', 'Merino wool', 'Linen', 'Polyester stretch']), Care: 'Machine wash cold', Fit: pick(rnd, ['Regular', 'Slim', 'Relaxed']) };
  if (category === 'beauty') return { Brand: brand, Volume: pick(rnd, ['30 ml', '50 ml', '100 ml', '250 ml']), 'Skin type': pick(rnd, ['All', 'Dry', 'Sensitive', 'Combination']), 'Cruelty free': 'Yes' };
  return { ...base, Color: pick(rnd, ['Black', 'Silver', 'White', 'Navy', 'Graphite']), Warranty: pick(rnd, ['1 year', '2 years', '12 months']) };
}

function orderNumber(rnd: () => number): string {
  const d = (n: number) => String(Math.floor(rnd() * 10 ** n)).padStart(n, '0');
  return `112-${d(7)}-${d(7)}`;
}

const DAY = 86_400_000;

export async function seedDemoData(prisma: PrismaClient, log: (m: string) => void = console.log) {
  const rnd = mulberry32(20260101);

  log('🧹 Clearing catalog, carts, orders and reviews...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.question.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  // children first
  await prisma.category.deleteMany({ where: { parentId: { not: null } } });
  await prisma.category.deleteMany();

  const customer = await prisma.user.upsert({
    where: { email: DEMO_CUSTOMER.email },
    update: { password: await hash(DEMO_CUSTOMER.password, 12), name: DEMO_CUSTOMER.name },
    create: {
      email: DEMO_CUSTOMER.email,
      name: DEMO_CUSTOMER.name,
      role: UserRole.USER,
      password: await hash(DEMO_CUSTOMER.password, 12),
    },
  });

  // Categories (parents before children)
  const catId = new Map<string, string>();
  for (const c of [...CATEGORIES].sort((a, b) => Number(!!a.parent) - Number(!!b.parent))) {
    const created = await prisma.category.create({
      data: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        image: `/images/categories/${c.slug}.svg`,
        parentId: c.parent ? catId.get(c.parent) : undefined,
      },
    });
    catId.set(c.slug, created.id);
  }
  log(`📂 Created ${CATEGORIES.length} categories`);

  // Products
  const created: { id: string; slug: string; name: string; price: number; sku: string; category: string }[] = [];
  const now = Date.now();
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i]!;
    const sku = `${p.brand.slice(0, 3).toUpperCase()}-${p.slug.replace(/-/g, '').slice(0, 8).toUpperCase()}-${100 + i}`;
    const bullets = shuffle(rnd, BULLET_POOL[p.category] ?? BULLET_POOL['home-garden']!).slice(0, 4);
    const soldCount = Math.floor(rnd() ** 3 * 5000) + 10;
    const row = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        content: `${p.description}. ${p.name} by ${p.brand} is designed for people who want quality they can rely on every day.`,
        price: p.price,
        comparePrice: p.comparePrice,
        costPrice: Math.round(p.price * 0.6 * 100) / 100,
        status: ProductStatus.PUBLISHED,
        sku,
        tags: p.tags,
        brand: p.brand,
        bullets,
        specs: specsFor(p.category, p.brand, rnd),
        soldCount,
        categoryId: catId.get(p.category),
        createdAt: new Date(now - Math.floor(rnd() * 60) * DAY),
        seoTitle: `${p.name} | ${p.brand}`,
        seoDescription: p.description,
      },
    });
    const imgs = productImages(p.slug);
    await prisma.productImage.createMany({
      data: imgs.map((url, position) => ({
        productId: row.id,
        url,
        altText: `${p.name} - ${position === 0 ? 'Main' : 'Alternate'} image`,
        position,
      })),
    });

    // Stock: a few out of stock, a few low, the rest healthy
    const r = rnd();
    const available = r < 0.06 ? 0 : r < 0.14 ? 1 + Math.floor(rnd() * 5) : 20 + Math.floor(rnd() * 180);
    await prisma.inventory.create({
      data: { productId: row.id, quantity: available + Math.floor(rnd() * 10), reserved: 0, available },
    });

    // Reviews
    const reviewCount = 4 + Math.floor(rnd() * (soldCount > 1500 ? 34 : 14));
    const bias = rnd(); // product-level quality bias
    const reviews = Array.from({ length: reviewCount }, () => {
      const x = rnd() + (bias - 0.5) * 0.5;
      const rating = x > 0.45 ? 5 : x > 0.22 ? 4 : x > 0.1 ? 3 : x > 0.04 ? 2 : 1;
      const aspects = shuffle(rnd, ASPECTS[p.category] ?? ASPECTS['home-garden']!).slice(0, 1 + Math.floor(rnd() * 2));
      return {
        productId: row.id,
        rating,
        title: pick(rnd, TITLES[rating]!),
        body: `${pick(rnd, OPENERS[rating]!)} ${aspects.join(' ')} ${pick(rnd, CLOSERS[rating]!)}`,
        authorName: pick(rnd, NAMES),
        verified: rnd() > 0.15,
        helpful: Math.floor(rnd() ** 2 * 60),
        createdAt: new Date(now - Math.floor(rnd() * 300) * DAY),
      };
    });
    await prisma.review.createMany({ data: reviews });
    const avg = reviews.reduce((s, x) => s + x.rating, 0) / reviews.length;
    await prisma.product.update({
      where: { id: row.id },
      data: { avgRating: Math.round(avg * 10) / 10, reviewCount: reviews.length },
    });

    // Q&A
    const qa = shuffle(rnd, QA[p.category] ?? QA['home-garden'] ?? []);
    const questions = qa.slice(0, 1 + Math.floor(rnd() * qa.length)).map(([question, answer], idx) => ({
      productId: row.id,
      question,
      answer: idx === 0 && rnd() < 0.15 ? null : answer,
      answeredBy: idx === 0 && rnd() < 0.15 ? null : `${p.brand} Support`,
      answeredAt: new Date(now - Math.floor(rnd() * 100) * DAY),
      askerName: pick(rnd, NAMES),
      votes: Math.floor(rnd() * 25),
      createdAt: new Date(now - (100 + Math.floor(rnd() * 100)) * DAY),
    }));
    if (questions.length) await prisma.question.createMany({ data: questions });

    created.push({ id: row.id, slug: p.slug, name: p.name, price: p.price, sku, category: p.category });
  }
  log(`📦 Created ${created.length} products with images, stock, reviews and Q&A`);

  // Cart for the demo customer
  const cart = await prisma.cart.create({ data: { userId: customer.id } });
  for (const p of created.slice(0, 2)) {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: p.id, quantity: 1 } });
  }

  // One order in every status for the demo customer
  const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i]!;
    const items = shuffle(rnd, created).slice(0, 1 + Math.floor(rnd() * 3));
    const subtotal = items.reduce((s, x) => s + x.price, 0);
    const shipping = subtotal >= 75 ? 0 : 5.99;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const placed = new Date(now - (3 + i * 11) * DAY);
    await prisma.order.create({
      data: {
        orderNumber: orderNumber(rnd),
        status,
        subtotal,
        tax,
        shipping,
        total: Math.round((subtotal + tax + shipping) * 100) / 100,
        customerEmail: customer.email,
        customerPhone: '+12125551234',
        shippingName: customer.name ?? 'John Doe',
        shippingAddress: '123 Main St',
        shippingCity: 'New York',
        shippingState: 'NY',
        shippingZip: '10001',
        shippingCountry: 'US',
        shippingMethod: 'standard',
        userId: customer.id,
        createdAt: placed,
        paidAt: status === 'PENDING' ? null : placed,
        trackingNumber: ['SHIPPED', 'DELIVERED'].includes(status) ? `1Z${Math.floor(rnd() * 1e10)}` : null,
        shippedAt: ['SHIPPED', 'DELIVERED'].includes(status) ? new Date(placed.getTime() + 2 * DAY) : null,
        deliveredAt: status === 'DELIVERED' ? new Date(placed.getTime() + 5 * DAY) : null,
        cancelledAt: status === 'CANCELLED' ? new Date(placed.getTime() + DAY) : null,
        orderItems: {
          create: items.map(x => ({
            productId: x.id,
            quantity: 1,
            price: x.price,
            productName: x.name,
            productSku: x.sku,
          })),
        },
      },
    });
  }
  log(`📋 Created ${statuses.length} demo orders (one per status)`);

  return { products: created.length, categories: CATEGORIES.length };
}
