import type { LicenseRow } from './ff12-parse.ts'
import { toPlainText } from './mediawiki.ts'

export type Category = 'gear' | 'magick' | 'technick' | 'augment' | 'esper' | 'quickening'
export type License = { name: string; category: Category; description: string; lp?: number }

const SECTION_CATEGORY: Record<string, Category> = {
  Equipment: 'gear',
  Magick: 'magick',
  Technicks: 'technick',
  Augments: 'augment',
  'Espers and Quickenings': 'esper', // quickening rows are told apart by name
}

// Spelling differences between job pages for the same license.
const ALIASES: Record<string, string> = {
  Bloodsword: 'Blood Sword',
  'Mace (2)': 'Maces (2)',
  'Mace (3)': 'Maces (3)',
}

// Turns one job page's rows into licenses. Rows that bundle several licenses
// ("Potion Lore 1-2-3", "+30/70/110 HP") become one license each.
export function toLicenses(rows: LicenseRow[]): License[] {
  let quickenings = 0
  return rows.flatMap((row): License[] => {
    const plain = toPlainText(row.name)
    const name = ALIASES[plain] ?? plain
    const lps = (row.cells.at(-1)?.match(/\d+/g) ?? []).map(Number)
    let category = SECTION_CATEGORY[row.section]
    if (!category) throw new Error(`unknown license section "${row.section}"`)

    if (category === 'esper') {
      if (name === 'Quickening') {
        category = 'quickening'
        return [{ name: `Quickening ${++quickenings}`, category, description: 'Unlocks one of the character’s Quickenings.', lp: lps[0] }]
      }
      return [{ name, category, description: `Summons the Esper ${name}.`, lp: lps[0] }]
    }

    const hp = name.match(/^\+?(\d+(?:\/\+?\d+)+) HP$/)
    if (hp) {
      return hp[1].split('/').map((v, i) => {
        const n = v.replace('+', '')
        return { name: `+${n} HP`, category, description: `Increases max HP by ${n}.`, lp: lps[i] }
      })
    }

    const description = toPlainText(row.cells[0] ?? '')
    const range = name.match(/^(.*) (\d+(?:-\d+)+)$/)
    if (range) {
      return range[2].split('-').map((n, i, all) => ({
        name: `${range[1]} ${n}`,
        category,
        description: pickVariant(description, i, all.length),
        lp: lps[i],
      }))
    }

    // Repeated copies of one license (e.g. Battle Lore ×16) stay one license.
    // Their LP cost is only kept when every copy costs the same.
    return [{ name, category, description, lp: lps.every((lp) => lp === lps[0]) ? lps[0] : undefined }]
  })
}

// "restore 10%/15%/25% more HP" with i=1 of 3 → "restore 15% more HP"
function pickVariant(text: string, i: number, count: number): string {
  return text.replace(/[\d.]+%?(?:\/[\d.]+%?)+/g, (group) => {
    const parts = group.split('/')
    return parts.length === count ? parts[i] : group
  })
}
