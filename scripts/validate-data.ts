// Validates every src/data/games/*.json against GameDataSchema. Exits 1 on any failure.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { GameDataSchema } from '../src/data/schema.ts'

const dir = join(import.meta.dirname, '..', 'src', 'data', 'games')
const files = readdirSync(dir).filter((f) => f.endsWith('.json'))

let failed = false
for (const file of files) {
  const result = GameDataSchema.safeParse(JSON.parse(readFileSync(join(dir, file), 'utf8')))
  if (result.success) {
    const d = result.data
    console.log(`ok   ${file}: ${d.classes.length} classes, ${d.abilities.length} abilities, ${d.classAbilities.length} links`)
  } else {
    failed = true
    console.error(`FAIL ${file}\n${z.prettifyError(result.error)}`)
  }
}

if (files.length === 0) console.log('no game data files yet')
process.exit(failed ? 1 : 0)
