import { GameDataSchema, type GameData } from '../../src/data/schema.ts'
import { toLicenses, type License } from './ff12-licenses.ts'
import { parseLicenseList } from './ff12-parse.ts'

export type JobPage = { name: string; wikitext: string }

const GAME = {
  id: 'ff12',
  name: 'Final Fantasy XII: The Zodiac Age',
  sourceUrl: 'https://finalfantasy.fandom.com/wiki/License_Board',
  attributeDefs: [{ key: 'lp', label: 'LP cost', type: 'number' as const }],
  categories: [
    { id: 'magick', label: 'Magick', hiddenByDefault: false },
    { id: 'technick', label: 'Technick', hiddenByDefault: false },
    { id: 'esper', label: 'Esper', hiddenByDefault: false },
    { id: 'quickening', label: 'Quickening', hiddenByDefault: false },
    { id: 'augment', label: 'Augment', hiddenByDefault: true },
    { id: 'gear', label: 'Gear', hiddenByDefault: true },
  ],
}

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Cúchulainn → Cuchulainn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// Merges every job board into one game file. A license on several boards is
// stored once; where boards disagree, the most common description wins and
// the LP cost is left out (it depends on the board position).
export function buildGameData(pages: JobPage[]): GameData {
  const versions = new Map<string, License[]>()
  const classAbilities: GameData['classAbilities'] = []

  for (const page of pages) {
    const classId = `ff12:${slugify(page.name)}`
    const linked = new Set<string>()
    for (const license of toLicenses(parseLicenseList(page.wikitext))) {
      const id = `ff12:${slugify(license.name)}`
      versions.set(id, [...(versions.get(id) ?? []), license])
      if (!linked.has(id)) classAbilities.push({ classId, abilityId: id, meta: {} })
      linked.add(id)
    }
  }

  const abilities = [...versions].map(([id, vs]) => {
    const lp = new Set(vs.map((v) => v.lp)).size === 1 ? vs[0].lp : undefined
    return {
      id,
      name: vs[0].name,
      category: vs[0].category,
      description: mostCommon(vs.map((v) => v.description)),
      attributes: lp === undefined ? {} : { lp },
    }
  })

  return GameDataSchema.parse({
    game: GAME,
    classes: pages.map((p) => ({ id: `ff12:${slugify(p.name)}`, name: p.name })),
    abilities,
    classAbilities,
  })
}

// Ties go to the value seen first.
function mostCommon(values: string[]): string {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts].reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0]
}
