import { describe, expect, it } from 'vitest'
import type { LicenseRow } from './ff12-parse.ts'
import { toLicenses } from './ff12-licenses.ts'

const row = (section: string, name: string, ...cells: string[]): LicenseRow => ({ section, name, cells })

describe('toLicenses', () => {
  it('maps sections to categories and cleans names, descriptions and LP', () => {
    expect(
      toLicenses([
        row('Technicks', '{{LA|Libra (Final Fantasy XII)|Libra}}', 'Reveal [[Target|target]] info.', '25'),
        row('Equipment', '{{A|Bloodsword}}', 'Allows character to equip Blood Sword.', '50'),
      ]),
    ).toEqual([
      { name: 'Libra', category: 'technick', description: 'Reveal target info.', lp: 25 },
      { name: 'Blood Sword', category: 'gear', description: 'Allows character to equip Blood Sword.', lp: 50 },
    ])
  })

  it('splits numbered ranges and picks each variant of the description', () => {
    const [, second] = toLicenses([row('Augments', '{{A|Potion Lore}} 1-2-3', 'Potions restore 10%/15%/25% more HP.', '3', '20/35/70')])
    expect(second).toEqual({ name: 'Potion Lore 2', category: 'augment', description: 'Potions restore 15% more HP.', lp: 35 })
  })

  it('splits every HP row format into one license per value', () => {
    const formats = [
      '+30/70/110 HP',
      '{{A|HP +|+30/70/110 HP}}',
      '{{A|+30 HP|+30}}/{{A|+70 HP|70}}/<br/>{{A|+110 HP|110 HP}}',
      '+30/+70/+110 HP',
    ]
    for (const name of formats) {
      const licenses = toLicenses([row('Augments', name, 'Increases HP.', '3', '20/30/<br/>40')])
      expect(licenses.map((l) => [l.name, l.lp])).toEqual([['+30 HP', 20], ['+70 HP', 30], ['+110 HP', 40]])
    }
  })

  it('keeps repeated copies as one license, with LP only when all copies cost the same', () => {
    const [lore, slot] = toLicenses([
      row('Augments', '{{A|Battle Lore}}', 'Str+1', '3', '30/30/<br/>>30'),
      row('Augments', '{{A|Gambit Slot}}', 'Adds a slot.', '2', '15/20'),
    ])
    expect(lore.lp).toBe(30)
    expect(slot.lp).toBeUndefined()
  })

  it('numbers quickenings in page order and labels espers', () => {
    const licenses = toLicenses([
      row('Espers and Quickenings', 'Quickening', 'None', '50'),
      row('Espers and Quickenings', '{{LA|Belias (Final Fantasy XII)|Belias}}', '[[#Gil Toss|Gil Toss]]', '20'),
      row('Espers and Quickenings', '{{A|Quickening 2|Quickening}}', 'None', '75'),
    ])
    expect(licenses.map((l) => [l.name, l.category, l.lp])).toEqual([
      ['Quickening 1', 'quickening', 50],
      ['Belias', 'esper', 20],
      ['Quickening 2', 'quickening', 75],
    ])
    expect(licenses[1].description).toBe('Summons the Esper Belias.')
  })

  it('rejects unknown sections', () => {
    expect(() => toLicenses([row('Annotations', 'x', 'y', '1')])).toThrow('unknown license section "Annotations"')
  })
})
