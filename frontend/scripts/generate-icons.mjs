/* eslint-env node */
/**
 * Génère toutes les icônes (PWA, favicon, apple-touch, logo in-app)
 * à partir de branding/logo.(svg|png|webp).
 *
 *   npm run icons
 *   ICON_BG="#0f172a" npm run icons     # couleur du fond maskable
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BRAND = path.join(ROOT, 'branding')
const OUT = path.join(ROOT, 'public', 'icons')
const BG = process.env.ICON_BG || '#1E3A8A'

const find = (base) =>
  ['svg', 'png', 'webp', 'jpg', 'jpeg']
    .map((ext) => path.join(BRAND, `${base}.${ext}`))
    .find((p) => fs.existsSync(p))

const logo = find('logo')
if (!logo) {
  console.error('✖ Aucun logo trouvé : placez branding/logo.svg (ou logo.png).')
  process.exit(1)
}
const maskableSrc = find('logo-maskable')
const isSvg = logo.endsWith('.svg')
fs.mkdirSync(OUT, { recursive: true })

// density élevée → SVG net même en 512 px
const open = (file) => sharp(file, file.endsWith('.svg') ? { density: 512 } : {})
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 }

async function square(file, size, out, fit = 'contain') {
  await open(file)
    .resize(size, size, { fit, background: TRANSPARENT })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, out))
  console.log('✔', out)
}

// Icône adaptative : soit la variante fournie, soit le logo centré (60 %) sur fond uni
async function maskable(size, out) {
  if (maskableSrc) return square(maskableSrc, size, out, 'cover')
  const inner = Math.round(size * 0.6)
  const glyph = await open(logo)
    .resize(inner, inner, { fit: 'contain', background: TRANSPARENT })
    .png()
    .toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: glyph, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, out))
  console.log('✔', out, `(fond ${BG})`)
}

await square(logo, 192, 'icon-192.png')
await square(logo, 512, 'icon-512.png')
await maskable(512, 'icon-maskable-512.png')
await maskable(180, 'apple-touch-icon.png')   // iOS n'aime pas la transparence
await square(logo, 32, 'favicon-32.png')
await square(logo, 256, 'logo.png')            // affiché dans la Navbar (net en retina)

console.log(`\nLogo source : ${path.relative(ROOT, logo)} (${isSvg ? 'SVG' : 'bitmap'})`)
