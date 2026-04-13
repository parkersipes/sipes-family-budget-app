// Tiny script to rasterize icon.svg -> icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon.png
// Only runs if `sharp` is available. Otherwise, falls back to copying the SVG so dev keeps working.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const pub = path.resolve(__dirname, '..', 'public');
const svgPath = path.join(pub, 'icon.svg');
const svg = fs.readFileSync(svgPath);

async function main() {
  try {
    const { default: sharp } = await import('sharp');
    const sizes = [
      { name: 'icon-192.png', size: 192 },
      { name: 'icon-512.png', size: 512 },
      { name: 'icon-512-maskable.png', size: 512 },
      { name: 'apple-touch-icon.png', size: 180 },
    ];
    for (const s of sizes) {
      await sharp(svg).resize(s.size, s.size).png().toFile(path.join(pub, s.name));
      console.log('wrote', s.name);
    }
  } catch (e) {
    console.warn('sharp not installed — skipping icon rasterization:', e?.message);
  }
}
main();
