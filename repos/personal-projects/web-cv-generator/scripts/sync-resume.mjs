import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const source = path.resolve(here, '../../resume-data-source/index.json')
const destDir = path.resolve(here, '../public/resumes')
const dest = path.join(destDir, 'francisco-veloz.json')

if (!fs.existsSync(source)) {
  console.error(`Missing source: ${source}`)
  process.exit(1)
}

fs.mkdirSync(destDir, { recursive: true })
fs.copyFileSync(source, dest)
console.log(`Copied ${source} -> ${dest}`)
