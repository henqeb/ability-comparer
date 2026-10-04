import { describe, expect, it } from 'vitest'
import { buildGameData, slugify } from './ff12-build.ts'

const page = (name: string, ...rows: [string, string, string][]) => ({
  name,
  wikitext: `==License list==\n===Technicks===\n{|\n${rows.map(([n, d, lp]) => `|-\n!${n}\n|${d}\n|${lp}`).join('\n')}\n|}`,
})

describe('slugify', () => {
  it('makes lowercase-kebab slugs without accents or symbols', () => {
    expect(['Cúchulainn', '+30 HP', 'Shikari Nagasa & Mina', 'Accessories (2)'].map(slugify)).toEqual([
      'cuchulainn',
      '30-hp',
      'shikari-nagasa-mina',
      'accessories-2',
    ])
  })
})

describe('buildGameData', () => {
  const data = buildGameData([
    page('Archer', ['Libra', 'Reveal info.', '25'], ['Charm', 'Confuse a foe.', '30']),
    page('Black Mage', ['Libra', 'Reveal info.', '25'], ['Charm', 'Confuse one foe.', '40']),
    page('Shikari', ['Libra', 'Show info.', '25'], ['Libra', 'Reveal info.', '25']),
  ])

  it('stores a license on several boards once and links it to each class once', () => {
    expect(data.abilities.map((a) => a.id)).toEqual(['ff12:libra', 'ff12:charm'])
    expect(data.classAbilities.filter((l) => l.abilityId === 'ff12:libra').map((l) => l.classId)).toEqual([
      'ff12:archer',
      'ff12:black-mage',
      'ff12:shikari',
    ])
  })

  it('uses the most common description, falling back to the first seen', () => {
    expect(data.abilities[0].description).toBe('Reveal info.')
    expect(data.abilities[1].description).toBe('Confuse a foe.')
  })

  it('keeps LP only when every board agrees', () => {
    expect(data.abilities[0].attributes).toEqual({ lp: 25 })
    expect(data.abilities[1].attributes).toEqual({})
  })
})
