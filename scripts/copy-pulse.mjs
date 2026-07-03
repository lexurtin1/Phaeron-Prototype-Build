import { cp, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const src = path.join(root, 'pulse')
const dest = path.join(root, 'public', 'pulse')

if (!existsSync(src)) {
  console.error(`[copy-pulse] source not found: ${src}`)
  process.exit(1)
}

await rm(dest, { recursive: true, force: true })
await cp(src, dest, { recursive: true })
console.log(`[copy-pulse] copied ${src} -> ${dest}`)
