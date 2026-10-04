// Builds src/data/games/ff12.json from the Final Fantasy Wiki: npm run adapter:ff12
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildGameData, type JobPage } from './ff12-build.ts'
import { fetchWikitext } from './mediawiki.ts'

const API = 'https://finalfantasy.fandom.com/api.php'
const JOBS = [
  'Archer (Final Fantasy XII)',
  'Black Mage (Final Fantasy XII)',
  'Bushi',
  'Foebreaker',
  'Knight (Final Fantasy XII)',
  'Machinist (Final Fantasy XII)',
  'Monk (Final Fantasy XII)',
  'Red Battlemage',
  'Shikari',
  'Time Battlemage',
  'Uhlan (Final Fantasy XII)',
  'White Mage (Final Fantasy XII)',
]

const pages: JobPage[] = []
for (const title of JOBS) {
  pages.push({ name: title.replace(' (Final Fantasy XII)', ''), wikitext: await fetchWikitext(API, title) })
  console.log(`fetched ${title}`)
}

const data = buildGameData(pages)
const out = join(import.meta.dirname, '..', '..', 'src', 'data', 'games', 'ff12.json')
writeFileSync(out, JSON.stringify(data, null, 2) + '\n')
console.log(`wrote ${out}: ${data.classes.length} classes, ${data.abilities.length} abilities, ${data.classAbilities.length} links`)
