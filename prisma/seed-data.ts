// Location: prisma/seed-data.ts
// Fictional catalog definition shared by the seed and the placeholder-image generator.

export interface CategoryDef {
  slug: string;
  name: string;
  description: string;
  parent?: string;
  hue: number;
  icon: string;
}

export interface ProductDef {
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  comparePrice?: number;
  description: string;
  tags: string[];
}

export const CATEGORIES: CategoryDef[] = [
  { slug: 'electronics', name: 'Electronics', description: 'Electronic devices and gadgets', hue: 215, icon: '🔌' },
  { slug: 'smartphones', name: 'Smartphones', description: 'Latest smartphones and mobile devices', parent: 'electronics', hue: 205, icon: '📱' },
  { slug: 'laptops', name: 'Laptops', description: 'Laptops and notebooks', parent: 'electronics', hue: 225, icon: '💻' },
  { slug: 'audio', name: 'Headphones & Audio', description: 'Headphones, speakers and sound gear', parent: 'electronics', hue: 255, icon: '🎧' },
  { slug: 'clothing', name: 'Clothing', description: 'Fashion and apparel', hue: 340, icon: '👕' },
  { slug: 'mens-clothing', name: "Men's Clothing", description: 'Clothing for men', parent: 'clothing', hue: 350, icon: '👔' },
  { slug: 'womens-clothing', name: "Women's Clothing", description: 'Clothing for women', parent: 'clothing', hue: 325, icon: '👗' },
  { slug: 'home-garden', name: 'Home & Garden', description: 'Home improvement and garden supplies', hue: 150, icon: '🏡' },
  { slug: 'kitchen-dining', name: 'Kitchen & Dining', description: 'Cookware, appliances and tableware', hue: 25, icon: '🍳' },
  { slug: 'sports-outdoors', name: 'Sports & Outdoors', description: 'Fitness, camping and outdoor gear', hue: 175, icon: '⚽' },
  { slug: 'books', name: 'Books', description: 'Bestsellers, fiction and non-fiction', hue: 40, icon: '📚' },
  { slug: 'beauty', name: 'Beauty & Personal Care', description: 'Skincare, haircare and grooming', hue: 300, icon: '💄' },
  { slug: 'toys-games', name: 'Toys & Games', description: 'Toys, board games and puzzles', hue: 55, icon: '🧸' },
];

type T = [name: string, brand: string, price: number, compare: number, desc: string, tags: string];

const RAW: Record<string, T[]> = {
  smartphones: [
    ['iPhone 15 Pro', 'Apple', 999.99, 1099.99, 'Latest iPhone with advanced camera system', 'smartphone,apple,ios,premium'],
    ['Samsung Galaxy S24', 'Samsung', 899.99, 999.99, 'Flagship Android smartphone', 'smartphone,samsung,android,galaxy'],
    ['Pixelwave 8 Pro', 'Pixelwave', 799.0, 899.0, 'Android phone with a 120Hz OLED display and 7 years of updates', 'smartphone,android,camera'],
    ['Nova X5 5G', 'Novatek', 449.0, 0, 'Mid-range 5G phone with a 5000mAh battery and fast charging', 'smartphone,5g,budget'],
    ['Zephyr Lite Phone', 'Zephyr', 229.0, 279.0, 'Affordable everyday smartphone with a big 6.7" screen', 'smartphone,budget,android'],
    ['Fold Air Flip Phone', 'Novatek', 1099.0, 1249.0, 'Compact foldable smartphone with a 6.7" inner display', 'smartphone,foldable,premium'],
  ],
  laptops: [
    ['MacBook Air M2', 'Apple', 1199.99, 1299.99, 'Lightweight laptop with M2 chip', 'laptop,apple,macos,m2'],
    ['UltraBook Pro 14', 'Novatek', 1399.0, 1599.0, '14" ultrabook with OLED display and 16GB RAM', 'laptop,ultrabook,oled'],
    ['Gaming Beast 17', 'Vortex', 1799.0, 1999.0, '17" gaming laptop with RTX graphics and 165Hz screen', 'laptop,gaming,rtx'],
    ['Chromebook Go 12', 'Zephyr', 279.0, 329.0, 'Simple, fast 12" Chromebook for school and travel', 'laptop,chromebook,student'],
    ['WorkStation Slim 15', 'Vortex', 949.0, 0, '15.6" business laptop with fingerprint reader and 1TB SSD', 'laptop,business,ssd'],
    ['2-in-1 Flex Laptop', 'Novatek', 799.0, 899.0, 'Convertible touchscreen laptop with stylus support', 'laptop,2-in-1,touchscreen'],
  ],
  audio: [
    ['Wireless Headphones', 'SoundCore', 199.99, 249.99, 'High-quality wireless headphones with noise cancellation', 'headphones,wireless,bluetooth,noise-cancelling'],
    ['Buds Pro True Wireless', 'SoundCore', 129.0, 159.0, 'In-ear earbuds with active noise cancellation and wireless charging case', 'earbuds,wireless,anc'],
    ['Studio Monitor Headphones', 'Auralis', 149.0, 0, 'Wired over-ear headphones tuned for mixing and critical listening', 'headphones,wired,studio'],
    ['Portable Bluetooth Speaker', 'Auralis', 79.0, 99.0, 'Waterproof speaker with 20 hours of playtime', 'speaker,bluetooth,waterproof'],
    ['Smart Soundbar 2.1', 'Auralis', 249.0, 299.0, 'Dolby Atmos soundbar with wireless subwoofer', 'soundbar,tv,dolby'],
    ['Sport Earbuds Secure Fit', 'SoundCore', 59.0, 79.0, 'Sweat-resistant earbuds with ear hooks for running', 'earbuds,sport,wireless'],
    ['Retro Turntable', 'Auralis', 189.0, 0, 'Belt-drive turntable with Bluetooth output and built-in preamp', 'turntable,vinyl,retro'],
    ['Gaming Headset 7.1', 'Vortex', 89.0, 119.0, 'Surround-sound headset with detachable mic', 'headset,gaming,surround'],
  ],
  'mens-clothing': [
    ['Premium Cotton T-Shirt', 'Northline', 29.99, 39.99, 'Comfortable and stylish cotton t-shirt', 'clothing,cotton,casual,organic'],
    ['Slim Fit Chino Pants', 'Northline', 49.0, 64.0, 'Stretch-cotton chinos with a tailored slim fit', 'pants,chino,slim'],
    ['Classic Denim Jacket', 'Harbor & Co', 79.0, 99.0, 'Washed denim jacket with a timeless cut', 'jacket,denim,casual'],
    ['Merino Wool Sweater', 'Harbor & Co', 89.0, 0, 'Soft merino crewneck sweater for cool days', 'sweater,wool,winter'],
    ['Performance Running Shorts', 'Stridewell', 34.0, 44.0, 'Lightweight quick-dry shorts with a zip pocket', 'shorts,running,sport'],
    ['Oxford Button-Down Shirt', 'Northline', 44.0, 0, 'Easy-iron oxford shirt for work or weekends', 'shirt,oxford,office'],
    ['Waterproof Rain Jacket', 'Stridewell', 109.0, 139.0, 'Breathable 3-layer shell with taped seams', 'jacket,rain,outdoor'],
  ],
  'womens-clothing': [
    ['Linen Summer Dress', 'Aurelia', 69.0, 89.0, 'Breezy knee-length dress in 100% European linen', 'dress,linen,summer'],
    ['High-Rise Skinny Jeans', 'Aurelia', 54.0, 0, 'Stretch denim jeans with a flattering high rise', 'jeans,denim,skinny'],
    ['Cashmere Blend Cardigan', 'Aurelia', 119.0, 149.0, 'Soft open-front cardigan in a cashmere blend', 'cardigan,cashmere,winter'],
    ['Yoga Leggings Seamless', 'Stridewell', 39.0, 49.0, 'Buttery-soft seamless leggings with high compression', 'leggings,yoga,fitness'],
    ['Floral Wrap Blouse', 'Aurelia', 42.0, 0, 'Lightweight wrap blouse with a floral print', 'blouse,floral,office'],
    ['Quilted Puffer Vest', 'Harbor & Co', 85.0, 110.0, 'Packable down-alternative vest for layering', 'vest,puffer,outdoor'],
    ['Classic Trench Coat', 'Harbor & Co', 159.0, 199.0, 'Double-breasted water-repellent trench with belt', 'coat,trench,classic'],
  ],
  'home-garden': [
    ['Robot Vacuum Cleaner S5', 'CleanBot', 299.0, 379.0, 'Self-emptying robot vacuum with smart mapping', 'vacuum,robot,smart-home'],
    ['Memory Foam Pillow (2-Pack)', 'DreamNest', 49.0, 69.0, 'Cooling memory foam pillows for side and back sleepers', 'pillow,bedding,sleep'],
    ['Smart LED Bulb Starter Kit', 'Lumina', 34.0, 44.0, '4 color-changing Wi-Fi bulbs with a voice-control hub', 'led,smart-home,lighting'],
    ['Cordless Leaf Blower', 'GreenTech', 119.0, 0, 'Brushless 20V leaf blower with two batteries', 'garden,blower,cordless'],
    ['Indoor Herb Garden Kit', 'GreenTech', 59.0, 79.0, 'Self-watering hydroponic garden with grow light', 'garden,herbs,indoor'],
    ['Weighted Blanket 15 lb', 'DreamNest', 79.0, 99.0, 'Breathable cotton weighted blanket for calmer sleep', 'blanket,weighted,sleep'],
    ['Air Purifier HEPA 500', 'CleanBot', 169.0, 199.0, 'True HEPA purifier for rooms up to 500 sq ft', 'air-purifier,hepa,allergy'],
    ['Bamboo Storage Shelf', 'Lumina', 64.0, 0, '5-tier bamboo shelf for bathroom or kitchen', 'storage,bamboo,organizer'],
    ['Outdoor Solar String Lights', 'Lumina', 29.0, 39.0, '50ft waterproof solar-powered patio lights', 'lights,solar,outdoor'],
    ['Cordless Stick Vacuum', 'CleanBot', 199.0, 249.0, 'Lightweight stick vacuum with 60-minute runtime', 'vacuum,cordless,stick'],
  ],
  'kitchen-dining': [
    ['Digital Air Fryer 6Qt', 'CrispWave', 99.0, 129.0, 'Family-size air fryer with 8 one-touch presets', 'air-fryer,kitchen,appliance'],
    ['Nonstick Cookware Set 12pc', 'Hearthstone', 139.0, 189.0, 'Induction-ready nonstick pots and pans with glass lids', 'cookware,nonstick,set'],
    ['Programmable Coffee Maker', 'BrewMaster', 69.0, 0, '12-cup drip coffee maker with a built-in grinder', 'coffee,appliance,grinder'],
    ['Chef Knife 8" Forged Steel', 'Hearthstone', 59.0, 79.0, 'Razor-sharp German steel chef knife with a pakkawood handle', 'knife,chef,steel'],
    ['High-Speed Blender 1400W', 'CrispWave', 119.0, 149.0, 'Countertop blender for smoothies, soups and nut butters', 'blender,smoothie,appliance'],
    ['Cast Iron Skillet 12"', 'Hearthstone', 34.0, 0, 'Pre-seasoned skillet that goes from stove to oven to campfire', 'skillet,cast-iron,cookware'],
    ['Espresso Machine 15-Bar', 'BrewMaster', 189.0, 239.0, 'Compact espresso machine with a milk frother', 'espresso,coffee,appliance'],
    ['Glass Food Storage 18pc', 'Hearthstone', 39.0, 49.0, 'Airtight borosilicate containers, oven and freezer safe', 'storage,glass,meal-prep'],
    ['Stainless Steel Water Bottle', 'Stridewell', 24.0, 0, 'Insulated 32oz bottle keeps drinks cold for 24 hours', 'bottle,insulated,hydration'],
    ['Electric Kettle 1.7L', 'BrewMaster', 34.0, 44.0, 'Fast-boil kettle with temperature presets', 'kettle,tea,appliance'],
  ],
  'sports-outdoors': [
    ['Adjustable Dumbbell Set 52lb', 'IronPeak', 249.0, 299.0, 'Space-saving dumbbells that adjust from 5 to 52 lb', 'dumbbell,strength,home-gym'],
    ['Yoga Mat Extra Thick', 'Stridewell', 29.0, 39.0, 'Non-slip 8mm mat with carry strap', 'yoga,mat,fitness'],
    ['4-Person Camping Tent', 'Trailhead', 159.0, 199.0, 'Weatherproof dome tent that sets up in 5 minutes', 'tent,camping,outdoor'],
    ['Trail Running Shoes', 'Stridewell', 99.0, 129.0, 'Grippy, cushioned trail shoes with rock plate', 'shoes,running,trail'],
    ['Hiking Backpack 40L', 'Trailhead', 89.0, 0, 'Ventilated 40L pack with rain cover', 'backpack,hiking,outdoor'],
    ['Smart Fitness Tracker', 'PulseFit', 69.0, 89.0, 'Heart-rate, sleep and GPS tracking with 10-day battery', 'tracker,fitness,wearable'],
    ['Resistance Bands Set', 'IronPeak', 22.0, 29.0, '5 stackable bands with handles and door anchor', 'bands,fitness,home-gym'],
    ['Folding Camping Chair', 'Trailhead', 36.0, 0, 'Lightweight chair with cup holder, supports 300 lb', 'chair,camping,outdoor'],
    ['Mountain Bike Helmet', 'PulseFit', 54.0, 69.0, 'MIPS-equipped helmet with removable visor', 'helmet,bike,safety'],
    ['Foam Roller Deep Tissue', 'IronPeak', 26.0, 0, 'High-density roller for muscle recovery', 'foam-roller,recovery,fitness'],
  ],
  books: [
    ['The Silent Orchard', 'Meridian Press', 16.99, 0, 'A literary mystery set in a Tuscan family estate', 'novel,mystery,fiction'],
    ['Atomic Routines', 'Meridian Press', 18.99, 24.99, 'Small daily habits that compound into big results', 'self-help,habits,bestseller'],
    ['Cooking With Fire', 'Harbor Books', 29.99, 39.99, '120 recipes for the grill, smoker and campfire', 'cookbook,bbq,recipes'],
    ['A Brief History of Tomorrow', 'Meridian Press', 21.99, 0, 'How technology will reshape cities, work and nature', 'nonfiction,technology,future'],
    ['The Last Lighthouse', 'Harbor Books', 14.99, 19.99, 'A sweeping historical novel about a keeper and a storm', 'novel,historical,fiction'],
    ['Python for Curious Minds', 'Codex Publishing', 34.99, 44.99, 'Learn programming through 40 practical projects', 'programming,python,education'],
    ['Mindful Mornings Journal', 'Harbor Books', 15.99, 0, '90-day guided journal for gratitude and focus', 'journal,mindfulness,wellness'],
    ['Space Atlas for Kids', 'Codex Publishing', 19.99, 24.99, 'Illustrated tour of the solar system and beyond', 'kids,space,science'],
    ['Startup Playbook', 'Meridian Press', 24.99, 0, 'Practical lessons from 50 founders on building a company', 'business,startup,entrepreneur'],
    ['Wild Gardens', 'Harbor Books', 27.99, 34.99, 'Design a low-maintenance, pollinator-friendly garden', 'gardening,design,nature'],
  ],
  beauty: [
    ['Vitamin C Brightening Serum', 'Dermalux', 28.0, 36.0, 'Daily serum with 15% vitamin C and hyaluronic acid', 'skincare,serum,vitamin-c'],
    ['Hydrating Daily Moisturizer SPF 30', 'Dermalux', 24.0, 0, 'Lightweight moisturizer with broad-spectrum protection', 'skincare,spf,moisturizer'],
    ['Ionic Hair Dryer Pro', 'SilkSalon', 89.0, 119.0, 'Fast-drying ionic dryer with 3 heat settings and diffuser', 'hair,dryer,ionic'],
    ['Beard Grooming Kit', 'Northline', 34.0, 44.0, 'Oil, balm, brush and comb in a gift box', 'grooming,beard,gift'],
    ['Electric Toothbrush Sonic', 'Dermalux', 59.0, 79.0, 'Rechargeable sonic brush with 5 modes and travel case', 'dental,toothbrush,electric'],
    ['Argan Oil Shampoo & Conditioner', 'SilkSalon', 32.0, 0, 'Sulfate-free duo for dry or color-treated hair', 'hair,shampoo,argan'],
    ['Mineral Sunscreen SPF 50', 'Dermalux', 19.0, 0, 'Reef-safe, non-greasy face and body sunscreen', 'sunscreen,spf,mineral'],
    ['Silk Pillowcase Set', 'SilkSalon', 38.0, 49.0, '22-momme mulberry silk pillowcases (set of 2)', 'silk,sleep,hair'],
  ],
  'toys-games': [
    ['Building Blocks City Set 800pc', 'BrickBox', 54.0, 69.0, 'Compatible building set with 4 vehicles and 6 minifigures', 'blocks,building,kids'],
    ['Strategy Board Game: Realms', 'Tabletop Co', 44.0, 0, 'Award-winning strategy game for 2-5 players', 'board-game,strategy,family'],
    ['RC Off-Road Truck', 'BrickBox', 64.0, 79.0, 'Remote control truck with 4WD and rechargeable battery', 'rc,truck,outdoor'],
    ['1000-Piece Jigsaw Puzzle: Alpine Lake', 'Tabletop Co', 19.0, 0, 'Premium thick-board puzzle with a poster', 'puzzle,jigsaw,family'],
    ['Plush Dinosaur Companion', 'Cuddle Club', 24.0, 29.0, 'Ultra-soft 18" plush dinosaur for ages 3+', 'plush,dinosaur,kids'],
    ['STEM Robot Coding Kit', 'BrickBox', 79.0, 99.0, 'Build and program your own robot, no screen needed', 'stem,robot,coding'],
    ['Card Game: Fast Fingers', 'Tabletop Co', 12.0, 0, 'Quick-play party card game for 2-8 players', 'card-game,party,family'],
    ['Wooden Train Set 60pc', 'Cuddle Club', 49.0, 62.0, 'Classic wooden railway with bridges and tunnels', 'train,wood,toddler'],
    ['Art Supplies Mega Kit', 'Cuddle Club', 32.0, 42.0, '150-piece drawing and painting set in a carry case', 'art,drawing,kids'],
    ['Telescope for Beginners', 'Trailhead', 119.0, 149.0, '70mm refractor telescope with tripod and phone adapter', 'telescope,astronomy,science'],
  ],
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const PRODUCTS: ProductDef[] = Object.entries(RAW).flatMap(([category, items]) =>
  items.map(([name, brand, price, compare, description, tags]) => ({
    name,
    slug: name === 'Premium Cotton T-Shirt' ? 'premium-cotton-tshirt' : slugify(name),
    brand,
    category,
    price,
    comparePrice: compare || undefined,
    description,
    tags: tags.split(','),
  }))
);

/** Slugs that ship with hand-made SVGs in public/images/products (not regenerated). */
export const ORIGINAL_IMAGE_SLUGS = new Set([
  'iphone-15-pro',
  'macbook-air-m2',
  'samsung-galaxy-s24',
  'premium-cotton-tshirt',
  'wireless-headphones',
]);

export function productImages(slug: string): string[] {
  const base = `/images/products/${slug}`;
  return [`${base}.svg`, `${base}-alt.svg`];
}
