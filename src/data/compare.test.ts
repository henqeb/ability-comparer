import { describe, expect, it } from 'vitest'
import { abilityIds, compare } from './compare'
import { GameDataSchema } from './schema'

const ability = (slug: string) => ({ id: `t:${slug}`, name: slug, description: '', category: 'spell' })

// mage:    fire, heal, [evoker] bolt
// cleric:  heal, bless, [light] bolt
// rogue:   stab, heal
// warlock: hex, [fiend] fire   ← only reachable via a subclass
const data = GameDataSchema.parse({
  game: { id: 't', name: 'T', sourceUrl: 'https://example.com', categories: [{ id: 'spell', label: 'Spell' }] },
  classes: [
    { id: 't:mage', name: 'Mage', subclasses: [{ id: 't:evoker', name: 'Evoker' }] },
    { id: 't:cleric', name: 'Cleric', subclasses: [{ id: 't:light', name: 'Light' }] },
    { id: 't:rogue', name: 'Rogue' },
    { id: 't:warlock', name: 'Warlock', subclasses: [{ id: 't:fiend', name: 'Fiend' }] },
  ],
  abilities: ['fire', 'heal', 'bolt', 'bless', 'stab', 'hex'].map(ability),
  classAbilities: [
    { classId: 't:mage', abilityId: 't:fire' },
    { classId: 't:mage', abilityId: 't:heal' },
    { classId: 't:mage', abilityId: 't:bolt', meta: { subclass: 't:evoker' } },
    { classId: 't:cleric', abilityId: 't:heal' },
    { classId: 't:cleric', abilityId: 't:bless' },
    { classId: 't:cleric', abilityId: 't:bolt', meta: { subclass: 't:light' } },
    { classId: 't:rogue', abilityId: 't:stab' },
    { classId: 't:rogue', abilityId: 't:heal' },
    { classId: 't:warlock', abilityId: 't:hex' },
    { classId: 't:warlock', abilityId: 't:fire', meta: { subclass: 't:fiend' } },
  ],
})

const names = (abilities: { name: string }[]) => abilities.map((a) => a.name)

describe('abilityIds', () => {
  it('returns base abilities only when no subclass is chosen', () => {
    expect([...abilityIds(data, 't:mage')]).toEqual(['t:fire', 't:heal'])
  })

  it('adds the chosen subclass abilities', () => {
    expect([...abilityIds(data, 't:mage', 't:evoker')]).toEqual(['t:fire', 't:heal', 't:bolt'])
  })

  it('includes every subclass with "any"', () => {
    expect([...abilityIds(data, 't:warlock', 'any')]).toEqual(['t:hex', 't:fire'])
  })
})

describe('compare', () => {
  it('1 class: unique is measured against every other class, including their subclasses', () => {
    const r = compare(data, [{ classId: 't:mage' }])
    expect(names(r.all['t:mage'])).toEqual(['fire', 'heal'])
    // fire is also on warlock (via fiend), heal on cleric and rogue → nothing unique
    expect(r.unique['t:mage']).toEqual([])

    expect(names(compare(data, [{ classId: 't:cleric' }]).unique['t:cleric'])).toEqual(['bless'])
  })

  it('2+ classes: unique is measured against the other selected classes only', () => {
    const r = compare(data, [{ classId: 't:mage' }, { classId: 't:cleric' }])
    expect(names(r.shared)).toEqual(['heal'])
    expect(names(r.unique['t:mage'])).toEqual(['fire']) // warlock not selected, so fire counts
    expect(names(r.unique['t:cleric'])).toEqual(['bless'])
  })

  it('subclass choice changes shared and unique', () => {
    const r = compare(data, [
      { classId: 't:mage', subclassId: 't:evoker' },
      { classId: 't:cleric', subclassId: 't:light' },
    ])
    expect(names(r.shared)).toEqual(['heal', 'bolt'])
    expect(names(r.unique['t:mage'])).toEqual(['fire'])

    const oneSub = compare(data, [{ classId: 't:mage', subclassId: 't:evoker' }, { classId: 't:cleric' }])
    expect(names(oneSub.shared)).toEqual(['heal'])
    expect(names(oneSub.unique['t:mage'])).toEqual(['fire', 'bolt'])
  })

  it('shared needs every selected class', () => {
    const r = compare(data, [{ classId: 't:mage' }, { classId: 't:cleric' }, { classId: 't:rogue' }])
    expect(names(r.shared)).toEqual(['heal'])
    expect(names(r.unique['t:rogue'])).toEqual(['stab'])
  })

  it('handles an empty selection', () => {
    expect(compare(data, [])).toEqual({ all: {}, shared: [], unique: {} })
  })

  it('rejects selecting the same class twice', () => {
    expect(() => compare(data, [{ classId: 't:mage' }, { classId: 't:mage', subclassId: 't:evoker' }])).toThrow()
  })
})
