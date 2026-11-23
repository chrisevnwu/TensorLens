import { readFile, readdir } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

const dist = new URL('../dist/', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('.vite/manifest.json', dist), 'utf8'))
const initialFiles = new Set()

function collectStaticImports(key) {
  const chunk = manifest[key]
  if (initialFiles.has(chunk.file)) return
  initialFiles.add(chunk.file)
  for (const dependency of chunk.imports ?? []) collectStaticImports(dependency)
}

collectStaticImports('index.html')
let initialBytes = 0
for (const file of initialFiles) {
  if (file.endsWith('.js')) initialBytes += gzipSync(await readFile(new URL(file, dist))).length
}
if (initialBytes >= 200_000) throw new Error('Landing JavaScript exceeds the 200 kB gzip budget: ' + initialBytes)

const labRoot = new URL('../src/labs/', import.meta.url)
const labs = await readdir(labRoot, { withFileTypes: true })
const labEntries = new Set()
for (const lab of labs.filter(item => item.isDirectory())) {
  const files = await readdir(new URL(lab.name + '/', labRoot))
  if (!files.includes('index.tsx')) continue
  const entry = manifest['src/labs/' + lab.name + '/index.tsx']
  if (!entry?.isDynamicEntry || initialFiles.has(entry.file) || labEntries.has(entry.file)) {
    throw new Error('Expected a separate lazy route for ' + lab.name)
  }
  labEntries.add(entry.file)
}
console.log('Landing JavaScript: ' + initialBytes + ' bytes gzip. Separate lazy lab entries: ' + labEntries.size + '.')
