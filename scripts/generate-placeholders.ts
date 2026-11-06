// Generates SVG placeholder images for every catalog product and category.
// Run with: npm run db:placeholders
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CATEGORIES, ORIGINAL_IMAGE_SLUGS, PRODUCTS } from '../prisma/seed-data';

const root = join(process.cwd(), 'public', 'images');
mkdirSync(join(root, 'products'), { recursive: true });
mkdirSync(join(root, 'categories'), { recursive: true });

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(text: string, max = 18): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if ((cur + ' ' + w).trim().length > max) {
      lines.push(cur.trim());
      cur = w;
    } else cur = `${cur} ${w}`;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines.slice(0, 3);
}

function productSvg(name: string, brand: string, hue: number, icon: string, alt: boolean) {
  const lines = wrap(name);
  const startY = 430 - (lines.length - 1) * 16;
  const text = lines
    .map((l, i) => `<text x="300" y="${startY + i * 34}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="hsl(${hue},35%,22%)">${esc(l)}</text>`)
    .join('');
  const iconY = alt ? 270 : 260;
  const deco = alt
    ? `<circle cx="470" cy="130" r="70" fill="hsl(${hue},60%,85%)"/><circle cx="110" cy="480" r="46" fill="hsl(${hue},60%,88%)"/>`
    : `<rect x="90" y="90" width="420" height="260" rx="28" fill="hsl(${hue},55%,90%)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,96%)"/><stop offset="1" stop-color="hsl(${(hue + 30) % 360},60%,86%)"/></linearGradient></defs>
<rect width="600" height="600" fill="url(#g)"/>${deco}
<text x="300" y="${iconY + 60}" text-anchor="middle" font-size="150">${icon}</text>
${text}
<text x="300" y="${startY + lines.length * 34 + 14}" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="hsl(${hue},25%,40%)">${esc(brand)}${alt ? ' · alt view' : ''}</text>
</svg>
`;
}

function categorySvg(name: string, hue: number, icon: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,94%)"/><stop offset="1" stop-color="hsl(${(hue + 30) % 360},60%,80%)"/></linearGradient></defs>
<rect width="400" height="400" fill="url(#g)"/>
<text x="200" y="230" text-anchor="middle" font-size="130">${icon}</text>
<text x="200" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="hsl(${hue},35%,22%)">${esc(name)}</text>
</svg>
`;
}

const catBySlug = new Map(CATEGORIES.map(c => [c.slug, c]));
let n = 0;
for (const p of PRODUCTS) {
  if (ORIGINAL_IMAGE_SLUGS.has(p.slug)) continue;
  const c = catBySlug.get(p.category)!;
  writeFileSync(join(root, 'products', `${p.slug}.svg`), productSvg(p.name, p.brand, c.hue, c.icon, false));
  writeFileSync(join(root, 'products', `${p.slug}-alt.svg`), productSvg(p.name, p.brand, c.hue, c.icon, true));
  n += 2;
}
for (const c of CATEGORIES) {
  writeFileSync(join(root, 'categories', `${c.slug}.svg`), categorySvg(c.name, c.hue, c.icon));
  n++;
}
console.log(`Generated ${n} SVG placeholders`);
