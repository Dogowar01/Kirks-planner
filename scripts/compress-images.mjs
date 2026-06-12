import sharp from 'sharp'
import { readdirSync, statSync } from 'fs'
import { join, basename, extname } from 'path'

const ASSETS = 'src/assets'
const MAX_W  = 1400   // plenty for a phone bg at 2x
const QUALITY = 78

const targets = [
  'Brighterpathways.png',
  'Signal9.png',
  'Apps.png',
  'Household.png',
  'Travel.png',
  'art-architectural.png',
  'art-ethereal.png',
  'art-newyork.png',
  'art-abstract.png',
  'art-portrait.png',
  'art-vintage-woman.png',
]

for (const name of targets) {
  const src  = join(ASSETS, name)
  const dest = join(ASSETS, basename(name, extname(name)) + '.webp')
  const before = statSync(src).size

  await sharp(src)
    .resize({ width: MAX_W, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(dest)

  const after = statSync(dest).size
  const pct = Math.round((1 - after / before) * 100)
  console.log(`${name.padEnd(30)} ${(before/1e6).toFixed(1)}MB → ${(after/1e6).toFixed(1)}MB  (−${pct}%)`)
}
console.log('\nDone. Update imports from .png → .webp')
